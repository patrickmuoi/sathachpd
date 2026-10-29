import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  User,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Save,
  Send,
  Cpu,
  PenTool,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import type { Attempt, Exam, Answer, User as UserType } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function GradeExam() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [officer, setOfficer] = useState<UserType | null>(null);

  // Grading form state: question_id -> { points: number, comment: string }
  const [grades, setGrades] = useState<Record<string, { points: number; comment: string }>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    loadData();
  }, [attemptId]);

  const loadData = async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      const data = await api.get<{
        attempt: Attempt;
        exam: Exam;
        answers: Answer[];
        officer: UserType;
      }>(`/grading/${attemptId}`);

      // Policy check: cannot grade own exam
      if (data.attempt.user_id === user?.userId) {
        alert(t('grading.cantGradeOwn'));
        navigate('/grader/queue');
        return;
      }

      setAttempt(data.attempt);
      setExam(data.exam);
      setAnswers(data.answers || []);
      setOfficer(data.officer);

      // Pre-populate grades for non-mcq questions
      const initialGrades: Record<string, { points: number; comment: string }> = {};
      data.answers?.forEach((a) => {
        initialGrades[a.question_id] = {
          points: a.manual_points ?? 0,
          comment: a.grader_comment ?? '',
        };
      });
      setGrades(initialGrades);
    } catch (err) {
      console.error('Error loading grading page', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePointChange = (qId: string, maxPoints: number, val: number | string) => {
    const num = Math.min(maxPoints, Math.max(0, typeof val === 'number' ? val : parseFloat(val) || 0));
    setGrades((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], points: num },
    }));
  };

  const handleCommentChange = (qId: string, comment: string) => {
    setGrades((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], comment },
    }));
  };

  // Tính điểm trắc nghiệm (tự chấm)
  const autoScore = attempt?.auto_score || 0;

  // Tính điểm tự luận do người chấm tự đưa ra
  const computeManualTotal = () => {
    let manual = 0;
    exam?.questions?.forEach((q) => {
      if (q.type !== 'mcq') {
        manual += grades[q.id]?.points || 0;
      }
    });
    return manual;
  };

  const manualScore = computeManualTotal();
  const currentTotal = autoScore + manualScore;

  const handleFinishGrading = async () => {
    if (!attempt) return;
    try {
      setFinishing(true);
      // Chỉ gửi điểm của các câu tự luận / true_false
      const essayGrades: Record<string, { points: number; comment: string }> = {};
      exam?.questions?.forEach((q) => {
        if (q.type !== 'mcq') {
          essayGrades[q.id] = grades[q.id] || { points: 0, comment: '' };
        }
      });

      await api.post(`/grading/${attempt.id}/complete`, { grades: essayGrades });
      setShowConfirmModal(false);
      navigate('/grader/queue');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu điểm');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!attempt || !exam) return <div className="text-center py-12">Không tìm thấy bài thi.</div>;

  const isPassing = currentTotal >= exam.pass_score;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate('/grader/queue')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại hàng chờ chấm thi</span>
      </button>

      {/* Header Sticky Banner */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
              Mã đề: {attempt.exam_code}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Thí sinh: <strong>{officer?.full_name}</strong> ({officer?.callsign})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
            {exam.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-2">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Cpu className="h-3.5 w-3.5" /> Trắc nghiệm tự chấm: {autoScore}đ
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
              <PenTool className="h-3.5 w-3.5" /> Tự luận người chấm đưa ra: {manualScore.toFixed(1)}đ
            </span>
            <span>•</span>
            <span>Điểm chuẩn đạt: <strong>{exam.pass_score}đ</strong></span>
          </div>
        </div>

        {/* Live Score Display & Finish Action */}
        <div className="flex items-center gap-4 bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)] shrink-0">
          <div>
            <span className="text-xs text-[var(--color-text-secondary)] block">Tổng điểm chung cuộc</span>
            <span className="text-3xl font-black text-[var(--color-text)]">
              {currentTotal.toFixed(1)}
              <span className="text-xs text-[var(--color-text-secondary)] font-normal"> / 10đ</span>
            </span>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border mb-2 block text-center ${
                isPassing
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-600 border-red-500/30'
              }`}
            >
              {isPassing ? 'DỰ KIẾN: ĐẠT' : 'DỰ KIẾN: KHÔNG ĐẠT'}
            </span>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Hoàn tất & Công bố điểm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions Grading List */}
      <div className="space-y-6">
        {exam.questions?.map((q, idx) => {
          const userAns = answers.find((a) => a.question_id === q.id);
          const isMcq = q.type === 'mcq';
          const isEssay = q.type === 'essay';
          const isTf = q.type === 'true_false_explain';
          const gradeData = grades[q.id] || { points: 0, comment: '' };

          // Kiểm tra xem thí sinh tích đúng hay sai ở trắc nghiệm
          const selectedOpt = q.options?.find((o) => o.id === userAns?.selected_option_id);
          const correctOpt = q.options?.find((o) => o.id === q.correct_option_id);
          const isUserCorrectMcq = isMcq && userAns?.selected_option_id === q.correct_option_id;

          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                isMcq
                  ? 'border-emerald-500/20 bg-[var(--color-surface)]'
                  : 'border-blue-500/30 bg-[var(--color-surface)] ring-1 ring-blue-500/10'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a6b] text-[#ffd700]">
                    Câu {idx + 1}
                  </span>
                  {isMcq ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Cpu className="h-3 w-3" />
                      <span>Trắc nghiệm (Hệ thống tự động tính điểm)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      <PenTool className="h-3 w-3" />
                      <span>Tự luận (Người chấm trực tiếp đưa điểm số ra)</span>
                    </span>
                  )}
                </div>

                <span className="text-xs font-black text-[var(--color-text)]">
                  Điểm tối đa: {q.points}đ
                </span>
              </div>

              {/* Question text */}
              <p className="text-sm font-bold text-[var(--color-text)] leading-relaxed">{q.text}</p>

              {/* Officer Answer */}
              <div className="rounded-xl bg-[var(--color-bg)] p-4 border border-[var(--color-border)] text-xs space-y-2">
                <span className="font-bold text-[var(--color-text-secondary)] block uppercase tracking-wider text-[11px]">
                  Bài làm của Thí sinh:
                </span>

                {isMcq ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--color-text-secondary)]">Thí sinh đã tích:</span>
                      {selectedOpt ? (
                        <span className={`font-bold px-2.5 py-1 rounded-lg border ${
                          isUserCorrectMcq
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-600 border-red-500/30'
                        }`}>
                          {selectedOpt.text}
                        </span>
                      ) : (
                        <span className="text-red-500 italic">Chưa tích chọn đáp án</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]">
                      <span className="font-bold text-[var(--color-text-secondary)]">Đáp án chuẩn của đề:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {correctOpt?.text || 'Chưa thiết lập'}
                      </span>
                    </div>
                  </div>
                ) : isTf ? (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[var(--color-text)]">
                      Lựa chọn: <span className="text-[#ffd700] uppercase">{userAns?.selected_boolean ? 'ĐÚNG' : 'SAI'}</span>
                    </p>
                    <p className="text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                      Nội dung giải thích: {userAns?.text_answer || <em className="text-[var(--color-text-secondary)]">Không có giải thích</em>}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[var(--color-text)] whitespace-pre-wrap leading-relaxed text-sm">
                      {userAns?.text_answer || <em className="text-[var(--color-text-secondary)]">Thí sinh không nhập câu trả lời</em>}
                    </p>
                    {userAns?.text_answer && (
                      <span className="text-[11px] text-[var(--color-text-secondary)] block pt-1">
                        (Độ dài: {userAns.text_answer.trim().split(/\s+/).length} từ • Yêu cầu tối thiểu: {q.min_words || 20} từ)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Grader Note / Model Answer criteria (Only visible to graders) */}
              <div className="rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/30 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                  ⭐ Tiêu chí chấm điểm & Barem của Đề thi (Nội bộ Hội đồng):
                </span>
                <p className="text-[var(--color-text)] leading-relaxed">
                  {q.grader_note || 'Không có ghi chú thêm.'}
                </p>
              </div>

              {/* Manual Grading Inputs (For essay / true_false) */}
              {!isMcq ? (
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <PenTool className="h-4 w-4" />
                      Cán bộ chấm thi tự đưa điểm số ra cho câu tự luận này:
                    </span>

                    {/* Quick point buttons */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--color-text-secondary)]">Chọn nhanh:</span>
                      <button
                        type="button"
                        onClick={() => handlePointChange(q.id, q.points, 0)}
                        className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-red-500 text-[11px] font-bold text-red-500"
                      >
                        0đ
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePointChange(q.id, q.points, Number((q.points / 2).toFixed(1)))}
                        className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-amber-500 text-[11px] font-bold text-amber-500"
                      >
                        {(q.points / 2).toFixed(1)}đ (50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePointChange(q.id, q.points, q.points)}
                        className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-emerald-500 text-[11px] font-bold text-emerald-600"
                      >
                        {q.points}đ (Tối đa)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                        Điểm cho (0 - {q.points}):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={q.points}
                          value={gradeData.points}
                          onChange={(e) => handlePointChange(q.id, q.points, e.target.value)}
                          className="w-full rounded-xl border border-blue-500 bg-[var(--color-surface)] p-2.5 text-base font-black text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-3 text-xs font-bold text-[var(--color-text-secondary)]">
                          / {q.points}đ
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                        Nhận xét / Đánh giá của Cán bộ chấm:
                      </label>
                      <input
                        type="text"
                        value={gradeData.comment}
                        onChange={(e) => handleCommentChange(q.id, e.target.value)}
                        placeholder="VD: Nêu đầy đủ các ý nghiệp vụ; trừ 0.5đ do chưa trích dẫn rõ Thông tư..."
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Hệ thống tự động chấm theo lựa chọn của thí sinh:
                    </span>
                  </div>
                  <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {userAns?.auto_points || 0} / {q.points} điểm
                  </strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Xác nhận hoàn tất chấm thi"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleFinishGrading}
              disabled={finishing}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55]"
            >
              {finishing ? 'Đang lưu kết quả...' : 'Xác nhận công bố điểm'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[var(--color-text)]">
            Đồng chí có chắc chắn muốn hoàn tất chấm điểm cho bài thi của Sĩ quan <strong>{officer?.full_name}</strong>? Kết quả sẽ được công bố chính thức ngay lập tức.
          </p>

          <div className="rounded-xl bg-[var(--color-bg)] p-4 border border-[var(--color-border)] text-xs space-y-2">
            <div className="flex justify-between">
              <span>Điểm trắc nghiệm (Hệ thống tự tính):</span>
              <strong className="text-emerald-600">{autoScore} điểm</strong>
            </div>
            <div className="flex justify-between">
              <span>Điểm tự luận (Đồng chí đưa ra):</span>
              <strong className="text-blue-600">{manualScore.toFixed(1)} điểm</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-sm">
              <span className="font-bold">Tổng điểm chung cuộc:</span>
              <strong className="text-base font-black">{currentTotal.toFixed(1)} / 10 điểm</strong>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span>Đánh giá kết quả:</span>
              <strong className={isPassing ? 'text-emerald-500 font-black' : 'text-red-500 font-black'}>
                {isPassing ? 'ĐẠT TIÊU CHUẨN (PASS)' : 'KHÔNG ĐẠT (FAIL)'}
              </strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
