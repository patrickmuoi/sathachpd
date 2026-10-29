import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Clock,
  AlertTriangle,
  Send,
  Flag,
  CheckCircle,
  HelpCircle,
  AlertOctagon,
  FileCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ANTI_CHEAT_CONFIG } from '../../lib/config';
import { ASSETS } from '../../assets';
import type { Attempt, Exam, Question, Answer } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function TakeExam() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Partial<Answer>>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());

  // Rules Confirmation Modal before starting
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Anti-cheat State
  const [violationsCount, setViolationsCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [cheatWarningMsg, setCheatWarningMsg] = useState('');
  const leaveTimeRef = useRef<number | null>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Initialize or fetch existing attempt
  useEffect(() => {
    initExamSession();
  }, [assignmentId]);

  const initExamSession = async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      // Check if attempt already exists or start new
      const res = await api.post<Attempt>('/attempts/start', { assignmentId });
      setAttempt(res);
      await loadAttemptDetails(res.id);
    } catch (err: any) {
      console.error('Failed to init attempt', err);
      setErrorMsg(err.message || 'Không thể khởi tạo phiên làm bài. Vui lòng thử lại hoặc liên hệ Quản trị viên.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttemptDetails = async (attemptId: string) => {
    try {
      const data = await api.get<{
        attempt: Attempt;
        exam: Exam;
        answers: Answer[];
      }>(`/attempts/${attemptId}`);

      setAttempt(data.attempt);
      setExam(data.exam);
      const qList = data.exam.questions || [];
      setQuestions(qList);

      if (qList.length === 0) {
        setErrorMsg('Đề thi này hiện tại chưa có câu hỏi nào được lưu trên hệ thống.');
      }

      // Rehydrate answers map
      const ansMap: Record<string, Partial<Answer>> = {};
      (data.answers || []).forEach((a) => {
        ansMap[a.question_id] = a;
      });
      setAnswers(ansMap);

      // Setup timer
      const deadline = new Date(data.attempt.deadline_at).getTime();
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimeLeft(remainingSeconds);

      // If user already submitted, navigate to results
      if (data.attempt.status !== 'in_progress') {
        navigate(`/officer/results/${data.attempt.id}`);
      }
    } catch (err: any) {
      console.error('Error loading attempt detail', err);
      setErrorMsg(err.message || 'Lỗi tải chi tiết bài thi');
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format timer HH:MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-save debounce
  const saveTimeoutRef = useRef<any>(null);
  const saveAnswer = (questionId: string, patch: Partial<Answer>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...patch },
    }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!attempt) return;
      try {
        await api.post(`/attempts/${attempt.id}/answers`, {
          questionId,
          ...patch,
        });
      } catch (err) {
        console.error('Auto save failed', err);
      }
    }, 1000);
  };

  // Anti-cheat Listeners
  const recordAntiCheatViolation = useCallback(
    async (type: 'leave' | 'return', reason: string, awaySeconds = 0) => {
      if (!attempt || attempt.status !== 'in_progress') return;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Send to server
      try {
        await api.post('/anticheat/event', {
          attempt_id: attempt.id,
          type,
          reason,
          device: isMobile ? 'mobile' : 'desktop',
          away_seconds: awaySeconds,
        });
      } catch (e) {
        // Beacon fallback if browser is unloading
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/anticheat/event',
            JSON.stringify({
              attempt_id: attempt.id,
              type,
              reason,
              device: isMobile ? 'mobile' : 'desktop',
              away_seconds: awaySeconds,
            })
          );
        }
      }
    },
    [attempt]
  );

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') return;

    const handleVisibilityChange = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (document.hidden) {
        leaveTimeRef.current = Date.now();
        recordAntiCheatViolation('leave', 'tab_hidden');
      } else {
        if (leaveTimeRef.current) {
          const awaySec = (Date.now() - leaveTimeRef.current) / 1000;
          leaveTimeRef.current = null;
          recordAntiCheatViolation('return', 'tab_hidden', awaySec);

          // Check mobile grace time
          if (isMobile && awaySec > ANTI_CHEAT_CONFIG.MOBILE_GRACE_SECONDS) {
            handleAutoSubmit('cheating_auto_submit');
            return;
          }

          // Desktop violation increment
          setViolationsCount((prev) => {
            const next = prev + 1;
            if (next >= ANTI_CHEAT_CONFIG.MAX_VIOLATIONS) {
              handleAutoSubmit('cheating_auto_submit');
            } else {
              setCheatWarningMsg(
                next === 2
                  ? t('anticheat.finalWarning')
                  : t('anticheat.warningCount', { count: next, max: ANTI_CHEAT_CONFIG.MAX_VIOLATIONS })
              );
              setShowCheatWarning(true);
            }
            return next;
          });
        }
      }
    };

    const handleBlur = () => {
      if (!document.hidden && !leaveTimeRef.current) {
        leaveTimeRef.current = Date.now();
        recordAntiCheatViolation('leave', 'window_blur');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Disable context menu & shortcuts in exam
    const handleContextMenu = (e: MouseEvent) => {
      if (ANTI_CHEAT_CONFIG.DISABLE_RIGHT_CLICK) {
        e.preventDefault();
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      if (ANTI_CHEAT_CONFIG.DISABLE_COPY_CUT_PASTE) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [attempt, recordAntiCheatViolation, t]);

  // Submit Handler
  const handleAutoSubmit = async (reason: 'timeout' | 'cheating_auto_submit') => {
    if (!attempt) return;
    try {
      await api.post(`/attempts/${attempt.id}/submit`, { submit_reason: reason });
      navigate(`/officer/results/${attempt.id}`);
    } catch (err) {
      console.error('Submit error', err);
    }
  };

  const handleManualSubmit = async () => {
    if (!attempt) return;
    setSubmitting(true);
    try {
      await api.post(`/attempts/${attempt.id}/submit`, { submit_reason: 'manual' });
      setShowSubmitModal(false);
      navigate(`/officer/results/${attempt.id}`);
    } catch (err) {
      console.error('Submit failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMarkQuestion = (qId: string) => {
    setMarkedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const getWordCount = (text = '') => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (errorMsg || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
        <div className="max-w-md w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-black text-[var(--color-text)]">
            Không thể vào phòng thi
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {errorMsg || 'Không tìm thấy thông tin lượt làm bài hoặc đề thi chưa được cấu hình câu hỏi.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => initExamSession()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow"
            >
              Thử kết nối lại
            </button>
            <button
              onClick={() => navigate('/officer/exams')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]"
            >
              ← Về danh sách bài thi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === 'mcq') return !!a.selected_option_id;
    if (q.type === 'true_false_explain') return a.selected_boolean !== undefined;
    return !!a.text_answer?.trim();
  }).length;

  return (
    <div className="exam-active min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Top Fixed Exam Header Bar */}
      <header className="sticky top-0 z-40 bg-[#102240] text-white px-4 py-3 shadow-md flex items-center justify-between border-b border-[#ffd700]/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#060d17] to-[#1a3a6b] p-1 border border-[#ffd700]/40 flex items-center justify-center shadow">
            <img
              src={ASSETS.getDepartmentLogo(exam?.department_id && exam.department_id !== 'all' ? exam.department_id : undefined)}
              alt="Department Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">
              {exam?.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-amber-200">
              <span>
                {t('exam.examCode')}: <strong className="font-mono">{attempt?.exam_code}</strong>
              </span>
              <span>•</span>
              <span>
                {t('exam.questionOf', { current: currentIdx + 1, total: questions.length })}
              </span>
            </div>
          </div>
        </div>

        {/* Timer & Submit Button */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
              timeLeft < 300
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-white/10 text-[#ffd700] border-[#ffd700]/30'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#ffd700] hover:bg-amber-400 text-[#060d17] shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('exam.submitExam')}</span>
            <span className="sm:hidden">{t('common.submit')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Desktop: Question Navigation Palette */}
        <div className="order-2 lg:order-1 lg:col-span-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              {t('exam.questions')}
            </span>
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              {answeredCount}/{questions.length} {t('exam.answered')}
            </span>
          </div>

          {/* Grid of Question Numbers */}
          <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const a = answers[q.id];
              const isAnswered =
                q.type === 'mcq'
                  ? !!a?.selected_option_id
                  : q.type === 'true_false_explain'
                  ? a?.selected_boolean !== undefined
                  : !!a?.text_answer?.trim();
              const isCurrent = idx === currentIdx;
              const isMarked = markedQuestions.has(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`relative h-10 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${
                    isCurrent
                      ? 'border-[#ffd700] bg-[#1a3a6b] text-[#ffd700] ring-2 ring-[#ffd700]/50'
                      : isAnswered
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isMarked && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] space-y-2 text-[11px] text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
              <span>{t('exam.answered')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)]" />
              <span>{t('exam.unanswered')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span>{t('exam.markForReview')}</span>
            </div>
          </div>
        </div>

        {/* Right / Center: Active Question Form */}
        <div className="order-1 lg:order-2 lg:col-span-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
          {currentQ ? (
            <div>
              {/* Question Header & Points */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a6b] text-[#ffd700]">
                    Câu {currentIdx + 1}
                  </span>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    ({currentQ.points} {t('exam.points')})
                  </span>
                </div>

                <button
                  onClick={() => toggleMarkQuestion(currentQ.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    markedQuestions.has(currentQ.id)
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>{t('exam.markForReview')}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-semibold text-[var(--color-text)] leading-relaxed mb-6">
                {currentQ.text}
              </div>

              {/* Input Based on Question Type */}
              {/* 1. Multiple Choice MCQ */}
              {currentQ.type === 'mcq' && (
                <div className="space-y-3">
                  {currentQ.options?.map((opt, i) => {
                    const isSelected = answers[currentQ.id]?.selected_option_id === opt.id;
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#ffd700] bg-[#1a3a6b]/5 dark:bg-[#ffd700]/5 ring-2 ring-[#ffd700]/40'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQ.id}`}
                          checked={isSelected}
                          onChange={() => saveAnswer(currentQ.id, { selected_option_id: opt.id })}
                          className="sr-only"
                        />
                        <div
                          className={`h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#1a3a6b] text-[#ffd700] border-[#ffd700]'
                              : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="text-sm text-[var(--color-text)] flex-1">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 2. True / False + Explain */}
              {currentQ.type === 'true_false_explain' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    {[
                      { val: true, label: 'ĐÚNG (True)' },
                      { val: false, label: 'SAI (False)' },
                    ].map((item) => {
                      const isSelected = answers[currentQ.id]?.selected_boolean === item.val;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => saveAnswer(currentQ.id, { selected_boolean: item.val })}
                          className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all ${
                            isSelected
                              ? 'bg-[#1a3a6b] text-[#ffd700] border-[#ffd700] shadow'
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {t('exam.explainYourReasoning')} ({t('exam.minWordsCount', { count: currentQ.min_words || 20 })})
                      </label>
                      <span
                        className={`text-xs font-bold ${
                          getWordCount(answers[currentQ.id]?.text_answer) >= (currentQ.min_words || 20)
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {t('exam.wordCount', { count: getWordCount(answers[currentQ.id]?.text_answer) })}
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={answers[currentQ.id]?.text_answer || ''}
                      onChange={(e) => saveAnswer(currentQ.id, { text_answer: e.target.value })}
                      placeholder="Trình bày căn cứ pháp lý và giải thích quyết định của đồng chí..."
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
                    />
                  </div>
                </div>
              )}

              {/* 3. Essay */}
              {currentQ.type === 'essay' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {t('exam.yourAnswer')} ({t('exam.minWordsCount', { count: currentQ.min_words || 20 })})
                    </label>
                    <span
                      className={`text-xs font-bold ${
                        getWordCount(answers[currentQ.id]?.text_answer) >= (currentQ.min_words || 20)
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {t('exam.wordCount', { count: getWordCount(answers[currentQ.id]?.text_answer) })}
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={answers[currentQ.id]?.text_answer || ''}
                    onChange={(e) => saveAnswer(currentQ.id, { text_answer: e.target.value })}
                    placeholder="Soạn thảo câu trả lời tự luận chi tiết theo đúng quy trình nghiệp vụ..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50 leading-relaxed"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              Không tìm thấy câu hỏi
            </div>
          )}

          {/* Navigation Controls: Previous / Next */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)] mt-8">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
            >
              ← {t('common.back')}
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow"
              >
                {t('common.next')} →
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-[#ffd700] text-[#060d17] shadow-lg hover:shadow-amber-500/20"
              >
                {t('exam.submitExam')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Anti-cheat Violation Warning Modal */}
      <Modal
        isOpen={showCheatWarning}
        onClose={() => setShowCheatWarning(false)}
        title="⚠️ CẢNH BÁO GIÁM SÁT THI"
        footer={
          <button
            onClick={() => setShowCheatWarning(false)}
            className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs"
          >
            Tôi đã hiểu và cam kết không rời màn hình
          </button>
        }
      >
        <div className="p-2 space-y-3 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-2">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-red-600 dark:text-red-400">
            {t('anticheat.violation')}
          </h4>
          <p className="text-xs text-[var(--color-text)] leading-relaxed">
            {cheatWarningMsg}
          </p>
          <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 text-left">
            Quy định: Rời khỏi phòng thi quá 3 lần, hoặc quá 30 giây trên thiết bị di động sẽ bị hệ thống tự động khóa và nộp bài với lý do gian lận.
          </div>
        </div>
      </Modal>

      {/* Manual Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={t('exam.submitExam')}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow"
            >
              {submitting ? t('common.loading') : t('common.confirm')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[var(--color-text)]">
            {t('exam.confirmSubmit')}
          </p>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Tổng số câu hỏi:</span>
              <strong className="text-[var(--color-text)]">{questions.length}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-500">Số câu đã trả lời:</span>
              <strong className="text-emerald-500">{answeredCount}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-500">Số câu chưa hoàn thành:</span>
              <strong className="text-amber-500">{questions.length - answeredCount}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

