import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, PlusCircle, Clock, Award, Copy, Trash2, Send, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import type { Exam } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function ExamList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<'all' | 'sasp' | 'bcso' | 'lspd'>('all');

  // Delete Exam Modal state
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await api.get<Exam[]>('/admin/exams');
      setExams(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneExam = async (exam: Exam) => {
    const clonedTitle = `${exam.title} (Bản sao)`;
    try {
      await api.post('/admin/exams', {
        ...exam,
        title: clonedTitle,
        status: 'draft',
      });
      await loadExams();
    } catch (e) {
      console.error('Clone failed', e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExam) return;
    setDeleteError(null);

    try {
      setDeleting(true);
      await api.delete(`/admin/exams/${deletingExam.id}`);
      setDeletingExam(null);
      await loadExams();
    } catch (err: any) {
      setDeleteError(err.message || 'Lỗi khi xóa bài thi');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">{t('nav.exams')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Soạn thảo đề thi trắc nghiệm, tự luận, phân công giao bài, nhân bản và xóa đề thi đã tạo.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/exams/create')}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{t('admin.createExam')}</span>
        </button>
      </div>

      {/* Department Filter Tabs */}
      <div className="flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] shadow-sm w-full sm:w-auto self-start">
        <button
          onClick={() => setDeptFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            deptFilter === 'all'
              ? 'bg-[#1a3a6b] dark:bg-[#ffd700] text-white dark:text-[#060d17] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          Tất cả đề thi ({exams.length})
        </button>
        <button
          onClick={() => setDeptFilter('sasp')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            deptFilter === 'sasp'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <img src="/sasplogo.png" alt="SASP" className="h-3.5 w-3.5 object-contain" />
          <span>SASP ({exams.filter((e) => e.department_id === 'sasp').length})</span>
        </button>
        <button
          onClick={() => setDeptFilter('lspd')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            deptFilter === 'lspd'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <img src="/lspd.png" alt="LSPD" className="h-3.5 w-3.5 object-contain" />
          <span>LSPD ({exams.filter((e) => e.department_id === 'lspd').length})</span>
        </button>
        <button
          onClick={() => setDeptFilter('bcso')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            deptFilter === 'bcso'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <img src="/sherifflogo.png" alt="BCSO" className="h-3.5 w-3.5 object-contain" />
          <span>BCSO ({exams.filter((e) => e.department_id === 'bcso').length})</span>
        </button>
      </div>

      {/* Empty State */}
      {exams.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-[var(--color-text-secondary)] opacity-40 mb-3" />
          <h3 className="text-base font-bold text-[var(--color-text)]">Chưa có đề thi nào</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Hãy bấm vào nút "Tạo đề thi mới" để tạo bài thi đầu tiên cho lực lượng.
          </p>
        </div>
      ) : (
        /* Grid of Exams */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams
            .filter((e) => {
              if (deptFilter === 'all') return true;
              return e.department_id === deptFilter;
            })
            .map((exam) => {
              const totalPoints = (exam.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
              const isBcso = exam.department_id === 'bcso';
              const isSasp = exam.department_id === 'sasp';
              const isLspd = exam.department_id === 'lspd';

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex flex-col justify-between group hover:border-[#ffd700]/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            exam.type === 'promotion'
                              ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                              : exam.type === 'certificate'
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                          }`}
                        >
                          {exam.type}
                        </span>

                        {/* Department Tag */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                            isBcso
                              ? 'bg-amber-600/15 text-amber-800 dark:text-amber-200 border border-amber-600/30'
                              : isLspd
                              ? 'bg-sky-600/15 text-sky-800 dark:text-sky-200 border border-sky-600/30'
                              : isSasp
                              ? 'bg-blue-600/15 text-blue-800 dark:text-blue-200 border border-blue-600/30'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20'
                          }`}
                        >
                          {isBcso ? (
                            <>
                              <img src="/sherifflogo.png" alt="BCSO" className="h-3 w-3 object-contain" />
                              <span>BCSO</span>
                            </>
                          ) : isLspd ? (
                            <>
                              <img src="/lspd.png" alt="LSPD" className="h-3 w-3 object-contain" />
                              <span>LSPD</span>
                            </>
                          ) : isSasp ? (
                            <>
                              <img src="/sasplogo.png" alt="SASP" className="h-3 w-3 object-contain" />
                              <span>SASP</span>
                            </>
                          ) : (
                            <span>🌐 CHUNG</span>
                          )}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exam.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        {exam.status === 'published' ? 'Đã công bố' : 'Bản nháp'}
                      </span>
                    </div>

                  <h3 className="text-base font-bold text-[var(--color-text)] line-clamp-2">
                    {exam.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-3">
                    <div className="flex justify-between">
                      <span>Số câu hỏi:</span>
                      <strong className="text-[var(--color-text)]">{exam.questions?.length || 0} câu</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng điểm đề:</span>
                      <strong className="text-[var(--color-text)]">{totalPoints} / 10đ</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời gian làm bài:</span>
                      <strong className="text-[var(--color-text)]">{exam.duration_minutes} phút</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Điểm chuẩn đạt:</span>
                      <strong className="text-emerald-600 font-bold">{exam.pass_score}đ</strong>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCloneExam(exam)}
                      title="Nhân bản đề thi"
                      className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[#ffd700] transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeletingExam(exam);
                      }}
                      title="Xóa đề thi này"
                      className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/assignments')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow transition-all flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Giao đề</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Exam Confirmation Modal */}
      <Modal
        isOpen={!!deletingExam}
        onClose={() => {
          setDeletingExam(null);
          setDeleteError(null);
        }}
        title="Xác nhận xóa đề thi"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setDeletingExam(null);
                setDeleteError(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow disabled:opacity-50"
            >
              {deleting ? t('common.loading') : 'Xác nhận xóa đề thi'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Lỗi xóa đề thi:</strong>
                <p className="leading-relaxed">{deleteError}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-[var(--color-text)] leading-relaxed">
                Đồng chí có chắc chắn muốn xóa vĩnh viễn đề thi:
              </p>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5 text-xs space-y-1.5">
                <p className="font-bold text-sm text-[var(--color-text)]">
                  {deletingExam?.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <span>Loại: {deletingExam?.type}</span>
                  <span>•</span>
                  <span>Thời lượng: {deletingExam?.duration_minutes} phút</span>
                  <span>•</span>
                  <span>Số câu hỏi: {deletingExam?.questions?.length || 0} câu</span>
                </div>
              </div>
              <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                ⚠️ Thao tác này sẽ xóa đề thi và các phân công tương ứng khỏi hệ thống.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
