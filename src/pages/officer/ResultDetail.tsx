import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
  Send,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Attempt, Exam, Answer, Appeal } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function ResultDetail() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [appeal, setAppeal] = useState<Appeal | null>(null);

  // Appeal Modal
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [attemptId]);

  const loadDetails = async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      const data = await api.get<{
        attempt: Attempt;
        exam: Exam;
        answers: Answer[];
        appeal?: Appeal;
      }>(`/results/${attemptId}`);

      setAttempt(data.attempt);
      setExam(data.exam);
      setAnswers(data.answers || []);
      setAppeal(data.appeal || null);
    } catch (err) {
      console.error('Failed to load result detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || !attempt) return;

    try {
      setSubmittingAppeal(true);
      const res = await api.post<Appeal>('/appeals', {
        attemptId: attempt.id,
        reason: appealReason.trim(),
      });
      setAppeal(res);
      setShowAppealModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi phúc khảo');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!attempt || !exam) {
    return <div className="text-center py-12">Không tìm thấy dữ liệu bài thi.</div>;
  }

  const isGraded = attempt.status === 'graded';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/officer/results')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại danh sách kết quả</span>
      </button>

      {/* Main Score Banner */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
              Mã đề: {attempt.exam_code}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Nộp lúc: {new Date(attempt.submitted_at || '').toLocaleString()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
            {exam.title}
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Thời lượng: {exam.duration_minutes} phút • Điểm chuẩn: {exam.pass_score}đ
          </p>
        </div>

        {/* Score Stamp */}
        <div className="flex items-center gap-4 bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
          {isGraded ? (
            <>
              <div>
                <span className="text-xs text-[var(--color-text-secondary)] block">Tổng điểm</span>
                <span className="text-3xl font-black text-[var(--color-text)]">
                  {attempt.final_score}
                  <span className="text-xs text-[var(--color-text-secondary)] font-normal"> / 10đ</span>
                </span>
              </div>
              <div>
                {attempt.passed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('grading.passed')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                    <XCircle className="h-4 w-4" />
                    {t('grading.failed')}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5 animate-spin" />
              <div>
                <p className="text-xs font-bold">Chờ hoàn tất chấm</p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Điểm trắc nghiệm: {attempt.auto_score || 0}đ
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appeal Banner */}
      {isGraded && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#ffd700]" />
              {t('appeal.requestAppeal')}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Nếu có bất kỳ thắc mắc hoặc cần xem xét lại điểm câu tự luận, đồng chí có thể gửi đơn phúc khảo lên Hội đồng sát hạch.
            </p>
          </div>

          {appeal ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                {appeal.status === 'pending'
                  ? 'Đơn phúc khảo đang được xem xét'
                  : appeal.status === 'approved'
                  ? 'Đã duyệt phúc khảo (Đang chấm lại)'
                  : appeal.status === 'regraded'
                  ? 'Đã chấm lại hoàn tất'
                  : 'Đơn phúc khảo bị từ chối'}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowAppealModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[#ffd700] text-[var(--color-text)] transition-colors shrink-0"
            >
              {t('appeal.requestAppeal')}
            </button>
          )}
        </div>
      )}

      {/* Question Details List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Chi tiết từng câu hỏi & Điểm số
        </h3>

        {exam.questions?.map((q, idx) => {
          const userAns = answers.find((a) => a.question_id === q.id);
          const isMcq = q.type === 'mcq';
          const pointsEarned = isMcq ? userAns?.auto_points : userAns?.manual_points;

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#1a3a6b] text-[#ffd700]">
                  Câu {idx + 1}
                </span>
                <span className="text-xs font-bold text-[var(--color-text)]">
                  Điểm đạt: {pointsEarned !== undefined ? `${pointsEarned} / ` : ''}
                  {q.points}đ
                </span>
              </div>

              {/* Question Text */}
              <p className="text-sm font-semibold text-[var(--color-text)] leading-relaxed">
                {q.text}
              </p>

              {/* Officer Answer */}
              <div className="rounded-xl bg-[var(--color-bg)] p-3.5 border border-[var(--color-border)] text-xs space-y-1">
                <span className="text-[11px] font-bold text-[var(--color-text-secondary)] block">
                  Câu trả lời của đồng chí:
                </span>
                {isMcq ? (
                  <p className="text-[var(--color-text)] font-medium">
                    {q.options?.find((o) => o.id === userAns?.selected_option_id)?.text || (
                      <em className="text-[var(--color-text-secondary)]">Chưa chọn đáp án</em>
                    )}
                  </p>
                ) : q.type === 'true_false_explain' ? (
                  <div className="space-y-1">
                    <p className="font-bold text-[var(--color-text)]">
                      Lựa chọn: {userAns?.selected_boolean ? 'ĐÚNG' : 'SAI'}
                    </p>
                    <p className="text-[var(--color-text)] whitespace-pre-wrap">
                      Giải thích: {userAns?.text_answer || 'Không có giải thích'}
                    </p>
                  </div>
                ) : (
                  <p className="text-[var(--color-text)] whitespace-pre-wrap">
                    {userAns?.text_answer || 'Chưa trả lời'}
                  </p>
                )}
              </div>

              {/* Show Model Answers & Grader Note only after graded */}
              {isGraded && (
                <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                  {/* Correct answer display */}
                  {isMcq && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Đáp án chuẩn:{' '}
                      {q.options?.find((o) => o.id === q.correct_option_id)?.text}
                    </div>
                  )}

                  {/* Grader Comment */}
                  {userAns?.grader_comment && (
                    <div className="rounded-xl bg-blue-500/10 p-3 border border-blue-500/20 text-xs">
                      <span className="font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
                        Nhận xét của Cán bộ chấm thi:
                      </span>
                      <p className="text-[var(--color-text)]">{userAns.grader_comment}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Appeal Submission Modal */}
      <Modal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        title={t('appeal.requestAppeal')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setShowAppealModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSendAppeal}
              disabled={submittingAppeal || !appealReason.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] disabled:opacity-40"
            >
              {submittingAppeal ? t('common.loading') : t('common.submit')}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSendAppeal} className="space-y-3">
          <label className="block text-xs font-semibold text-[var(--color-text)]">
            {t('appeal.reason')}
          </label>
          <textarea
            rows={5}
            required
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder={t('appeal.reasonPlaceholder')}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
          />
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            * {t('appeal.maxOneAppeal')}
          </p>
        </form>
      </Modal>
    </div>
  );
}

