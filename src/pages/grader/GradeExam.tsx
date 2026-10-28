import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  Send,
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
  const [savingDraft, setSavingDraft] = useState(false);
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

      // Pre-populate grades
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

  const handlePointChange = (qId: string, maxPoints: number, val: string) => {
    const num = Math.min(maxPoints, Math.max(0, parseFloat(val) || 0));
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

  const computeCurrentTotal = () => {
    let total = attempt?.auto_score || 0;
    Object.values(grades).forEach((g) => {
      total += g.points || 0;
    });
    return total;
  };

  const handleFinishGrading = async () => {
    if (!attempt) return;
    try {
      setFinishing(true);
      await api.post(`/grading/${attempt.id}/complete`, { grades });
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

  const currentTotal = computeCurrentTotal();
  const isPassing = currentTotal >= exam.pass_score;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/grader/queue')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại hàng chờ</span>
      </button>

      {/* Header Sticky Banner */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
              Mã bài thi: {attempt.exam_code}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Thí sinh: <strong>{officer?.full_name}</strong> ({officer?.callsign})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
            {exam.title}
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Điểm trắc nghiệm tự chấm: {attempt.auto_score || 0}đ • Điểm chuẩn đạt: {exam.pass_score}đ
          </p>
        </div>

        {/* Live Score Display & Finish Action */}
        <div className="flex items-center gap-4 bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
          <div>
            <span className="text-xs text-[var(--color-text-secondary)] block">Tổng điểm tính toán</span>
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{t('grading.finishGrading')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions Grading List */}
      <div className="space-y-6">
        {exam.questions?.map((q, idx) => {
          const userAns = answers.find((a) => a.question_id === q.id);
          const isMcq = q.type === 'mcq';
          const gradeData = grades[q.id] || { points: 0, comment: '' };

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a6b] text-[#ffd700]">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                    Loại: {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'essay' ? 'Tự luận' : 'Đúng/Sai có giải thích'}
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--color-text)]">
                  Điểm tối đa: {q.points}đ
                </span>
              </div>

              {/* Question text */}
              <p className="text-sm font-semibold text-[var(--color-text)]">{q.text}</p>

              {/* Officer Answer */}
              <div className="rounded-xl bg-[var(--color-bg)] p-4 border border-[var(--color-border)] text-xs space-y-1.5">
                <span className="font-bold text-[var(--color-text-secondary)] block">
                  Bài làm của Sĩ quan:
                </span>
                {isMcq ? (
                  <p className="text-[var(--color-text)] font-semibold">
                    {q.options?.find((o) => o.id === userAns?.selected_option_id)?.text || (
                      <em>Chưa chọn</em>
                    )}
                  </p>
                ) : q.type === 'true_false_explain' ? (
                  <div className="space-y-1">
                    <p className="font-bold text-[var(--color-text)]">
                      Lựa chọn: {userAns?.selected_boolean ? 'ĐÚNG' : 'SAI'}
                    </p>
                    <p className="text-[var(--color-text)] whitespace-pre-wrap">
                      Nội dung giải thích: {userAns?.text_answer || 'Không có giải thích'}
                    </p>
                  </div>
                ) : (
                  <p className="text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                    {userAns?.text_answer || 'Không có nội dung'}
                  </p>
                )}
              </div>

              {/* Grader Note / Model Answer criteria (Only visible to graders) */}
              <div className="rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/30 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                  ⭐ Tiêu chí chấm & Đáp án chuẩn (Nội bộ Hội đồng):
                </span>
                <p className="text-[var(--color-text)] leading-relaxed">
                  {q.grader_note || 'Không có ghi chú thêm.'}
                </p>
              </div>

              {/* Manual Grading Inputs (For essay / true_false) */}
              {!isMcq ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-[var(--color-border)]">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                      {t('grading.score')} (0 - {q.points}):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={q.points}
                      value={gradeData.points}
                      onChange={(e) => handlePointChange(q.id, q.points, e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-sm font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                      {t('grading.comment')}:
                    </label>
                    <input
                      type="text"
                      value={gradeData.comment}
                      onChange={(e) => handleCommentChange(q.id, e.target.value)}
                      placeholder="Nhận xét cụ thể lý do cho điểm..."
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-2">
                  ✓ Trắc nghiệm tự động chấm: {userAns?.auto_points || 0} / {q.points}đ
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
        title={t('grading.finishGrading')}
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
              {finishing ? t('common.loading') : t('common.confirm')}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-[var(--color-text)]">
            Đồng chí có chắc chắn muốn hoàn tất chấm điểm cho bài thi này? Kết quả sẽ được công bố ngay cho sĩ quan.
          </p>
          <div className="rounded-xl bg-[var(--color-bg)] p-3 border border-[var(--color-border)] text-xs space-y-1">
            <p>
              Tổng điểm chung cuộc: <strong>{currentTotal.toFixed(1)} / 10đ</strong>
            </p>
            <p>
              Đánh giá kết quả:{' '}
              <strong className={isPassing ? 'text-emerald-500' : 'text-red-500'}>
                {isPassing ? 'ĐẠT TIÊU CHUẨN' : 'KHÔNG ĐẠT'}
              </strong>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

