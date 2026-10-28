import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Clock, Award, Shield, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { ExamAssignment } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MyExams() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await api.get<ExamAssignment[]>('/assignments/my');
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Chưa bắt đầu
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
            Đang làm dở
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Chờ chấm điểm
          </span>
        );
      case 'graded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Đã có kết quả
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'promotion':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            {t('exam.promotion')}
          </span>
        );
      case 'certificate':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            {t('exam.certificate')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
            {t('exam.general')}
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-xs font-bold mb-2 border border-[#ffd700]/30">
              <Shield className="h-3.5 w-3.5" />
              SÁT HẠCH NỘI BỘ SỞ
            </div>
            <h1 className="text-2xl font-black">{t('nav.myExams')}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Danh sách các bài thi nghiệp vụ, kiểm tra thăng cấp và sát hạch chứng chỉ được giao cho đồng chí.
            </p>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-[var(--color-text-secondary)] opacity-40 mb-3" />
          <h3 className="text-base font-bold text-[var(--color-text)]">Hiện chưa có bài thi nào</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Khi Quản trị viên hoặc Chỉ huy phân công bài thi, đề thi sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((item) => {
            const isCompleted = item.status === 'submitted' || item.status === 'graded';
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {getTypeBadge(item.exam?.type)}
                      {item.exam?.department_id && item.exam.department_id !== 'all' && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            item.exam.department_id === 'bcso'
                              ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border border-amber-600/30'
                              : item.exam.department_id === 'lspd'
                              ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-600/30'
                              : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-600/30'
                          }`}
                        >
                          {item.exam.department_id.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-text)] line-clamp-2 group-hover:text-[#1a3a6b] dark:group-hover:text-[#ffd700] transition-colors">
                    {item.exam?.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#ffd700]" />
                      <span>
                        {t('exam.duration')}: <strong>{item.exam?.duration_minutes} phút</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#ffd700]" />
                      <span>
                        {t('exam.passScore')}: <strong>{item.exam?.pass_score} / 10 điểm</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                  {!isCompleted ? (
                    <button
                      onClick={() => navigate(`/exam/${item.id}`)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#1a3a6b] hover:bg-[#152e55] text-[#ffd700] shadow flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <Play className="h-3.5 w-3.5 fill-[#ffd700]" />
                      <span>{item.status === 'in_progress' ? 'Tiếp tục làm bài' : t('exam.startExam')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/officer/results')}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[#ffd700] text-[var(--color-text)] flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Xem kết quả & Chi tiết</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

