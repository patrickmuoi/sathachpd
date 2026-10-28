import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, CheckCircle2, XCircle, Clock, ChevronRight, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import type { Attempt } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Results() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [results, setResults] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await api.get<Attempt[]>('/results/my');
      setResults(data);
    } catch (err) {
      console.error('Failed to load results', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20">
        <h1 className="text-2xl font-black">{t('nav.results')}</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Bảng điểm tổng hợp và lịch sử các bài sát hạch nghiệp vụ đã nộp của đồng chí.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
          <Award className="mx-auto h-12 w-12 text-[var(--color-text-secondary)] opacity-40 mb-3" />
          <h3 className="text-base font-bold text-[var(--color-text)]">Chưa có kết quả bài thi nào</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Sau khi hoàn thành và nộp bài thi, kết quả đánh giá sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((att) => {
            const isGraded = att.status === 'graded';
            return (
              <div
                key={att.id}
                onClick={() => navigate(`/officer/results/${att.id}`)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
                      {att.exam_code}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(att.started_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[#1a3a6b] dark:group-hover:text-[#ffd700] transition-colors">
                    {att.exam?.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                    <span>
                      {t('exam.duration')}: {att.exam?.duration_minutes} phút
                    </span>
                    <span>•</span>
                    <span>Điểm chuẩn: {att.exam?.pass_score}đ</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--color-border)]">
                  {isGraded ? (
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[var(--color-text)]">
                          {att.final_score}
                          <span className="text-xs text-[var(--color-text-secondary)] font-normal"> / 10đ</span>
                        </span>
                        {att.passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('grading.passed')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <XCircle className="h-3.5 w-3.5" />
                            {t('grading.failed')}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--color-text-secondary)] block mt-0.5">
                        Đã chấm xong
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        Chờ cấp trên chấm tự luận
                      </span>
                      {att.auto_score !== undefined && (
                        <span className="text-[11px] text-[var(--color-text-secondary)] block mt-0.5">
                          Trắc nghiệm: {att.auto_score}đ
                        </span>
                      )}
                    </div>
                  )}

                  <ChevronRight className="h-5 w-5 text-[var(--color-text-secondary)] group-hover:text-[#ffd700] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

