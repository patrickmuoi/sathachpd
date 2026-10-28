import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, User, Clock, ChevronRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import type { Attempt } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function GradingQueue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await api.get<Attempt[]>('/grading/queue');
      setQueue(data);
    } catch (err) {
      console.error('Failed to load grading queue', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20">
        <div className="flex items-center gap-2 text-[#ffd700] text-xs font-bold mb-1">
          <ClipboardCheck className="h-4 w-4" />
          HỘI ĐỒNG CHẤM THI ĐỘC LẬP
        </div>
        <h1 className="text-2xl font-black">{t('nav.gradingQueue')}</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Danh sách các bài thi có phần tự luận và giải thích đang chờ cán bộ chỉ huy đánh giá điểm.
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
          <ClipboardCheck className="mx-auto h-12 w-12 text-[var(--color-text-secondary)] opacity-40 mb-3" />
          <h3 className="text-base font-bold text-[var(--color-text)]">{t('grading.noExamsToGrade')}</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Tất cả các bài thi đã được chấm điểm hoàn tất hoặc chỉ bao gồm câu hỏi trắc nghiệm tự chấm.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/grader/grading/${item.id}`)}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
                    {item.exam_code}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Nộp: {new Date(item.submitted_at || item.started_at).toLocaleString()}
                  </span>
                  {item.submit_reason === 'cheating_auto_submit' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30">
                      <ShieldAlert className="h-3 w-3" />
                      Tự nộp do vi phạm
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[#1a3a6b] dark:group-hover:text-[#ffd700] transition-colors">
                  {item.exam?.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <User className="h-3.5 w-3.5 text-[#ffd700]" />
                  <span>
                    Sĩ quan: <strong>{item.user?.full_name || item.user_id}</strong> ({item.user?.callsign})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/grader/grading/${item.id}`);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  <span>{t('grading.gradeBtnText')}</span>
                </button>
                <ChevronRight className="h-5 w-5 text-[var(--color-text-secondary)] group-hover:text-[#ffd700]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

