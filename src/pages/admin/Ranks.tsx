import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Plus, CheckCircle2, XCircle, Edit, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Rank } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function Ranks() {
  const { t } = useTranslation();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<'all' | 'sasp' | 'bcso' | 'lspd'>('all');

  // Add Rank Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [rankName, setRankName] = useState('');
  const [rankDept, setRankDept] = useState<'sasp' | 'bcso' | 'lspd'>('sasp');
  const [level, setLevel] = useState<number | string>(1);
  const [canGrade, setCanGrade] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  // Edit Rank Modal
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState<'sasp' | 'bcso' | 'lspd'>('sasp');
  const [editLevel, setEditLevel] = useState<number | string>(1);
  const [editCanGrade, setEditCanGrade] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Rank Modal
  const [deletingRank, setDeletingRank] = useState<Rank | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRanks();
  }, []);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const data = await api.get<Rank[]>('/admin/ranks');
      setRanks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add Rank
  const handleAddRank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankName.trim()) return;

    try {
      setSavingAdd(true);
      await api.post('/admin/ranks', {
        name: rankName.trim(),
        department_id: rankDept,
        level: Number(level) || 1,
        can_grade: canGrade,
      });
      setShowAddModal(false);
      setRankName('');
      setLevel(1);
      setCanGrade(false);
      await loadRanks();
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm cấp bậc');
    } finally {
      setSavingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (r: Rank) => {
    setEditingRank(r);
    setEditName(r.name);
    setEditDept((r.department_id as 'sasp' | 'bcso' | 'lspd') || 'sasp');
    setEditLevel(r.level);
    setEditCanGrade(r.can_grade);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRank || !editName.trim()) return;

    try {
      setSavingEdit(true);
      await api.patch(`/admin/ranks/${editingRank.id}`, {
        name: editName.trim(),
        department_id: editDept,
        level: Number(editLevel) || 1,
        can_grade: editCanGrade,
      });
      setEditingRank(null);
      await loadRanks();
    } catch (err: any) {
      alert(err.message || 'Lỗi chỉnh sửa cấp bậc');
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick toggle can_grade directly from table
  const handleToggleCanGrade = async (r: Rank) => {
    try {
      await api.patch(`/admin/ranks/${r.id}`, { can_grade: !r.can_grade });
      await loadRanks();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật quyền chấm thi');
    }
  };

  // Confirm and Delete
  const handleConfirmDelete = async () => {
    if (!deletingRank) return;
    setDeleteError(null);

    try {
      setDeleting(true);
      await api.delete(`/admin/ranks/${deletingRank.id}`);
      setDeletingRank(null);
      await loadRanks();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError(err.message || 'Không thể xóa cấp bậc này');
      }
    } finally {
      setDeleting(false);
    }
  };

  const filteredRanks = ranks.filter((r) => {
    if (deptFilter === 'all') return true;
    return r.department_id === deptFilter;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">{t('nav.ranks')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Quản lý hệ thống cấp bậc, phân theo từng Sở (SASP & BCSO) và thiết lập quyền chấm bài thi.
          </p>
        </div>

        <button
          onClick={() => {
            setRankName('');
            setRankDept('sasp');
            setLevel(ranks.length > 0 ? Math.max(...ranks.map((r) => r.level)) + 1 : 1);
            setCanGrade(false);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm cấp bậc</span>
        </button>
      </div>

      {/* Department Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] shadow-sm w-full sm:w-auto self-start">
        <button
          onClick={() => setDeptFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            deptFilter === 'all'
              ? 'bg-[#1a3a6b] dark:bg-[#ffd700] text-white dark:text-[#060d17] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          Tất cả ({ranks.length})
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
          <span>SASP ({ranks.filter((r) => r.department_id === 'sasp').length})</span>
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
          <span>LSPD ({ranks.filter((r) => r.department_id === 'lspd').length})</span>
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
          <span>BCSO ({ranks.filter((r) => r.department_id === 'bcso').length})</span>
        </button>
      </div>

      {/* Ranks Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">
            <tr>
              <th className="py-3.5 px-4">Tên cấp bậc</th>
              <th className="py-3.5 px-4">Sở Cảnh Sát</th>
              <th className="py-3.5 px-4">Bậc (Level)</th>
              <th className="py-3.5 px-4">Quyền chấm thi (can_grade)</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filteredRanks.map((r) => {
              const isBcsoRank = r.department_id === 'bcso';
              const isLspdRank = r.department_id === 'lspd';
              return (
                <tr key={r.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#ffd700]" />
                    <span>{r.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                        isBcsoRank
                          ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border border-amber-600/30'
                          : isLspdRank
                          ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-600/30'
                          : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-600/30'
                      }`}
                    >
                      <img
                        src={isBcsoRank ? '/sherifflogo.png' : isLspdRank ? '/lspd.png' : '/sasplogo.png'}
                        alt="Logo"
                        className="h-3 w-3 object-contain"
                      />
                      <span>{isBcsoRank ? 'BCSO' : isLspdRank ? 'LSPD' : 'SASP'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--color-text)]">
                    {r.level}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleCanGrade(r)}
                      title="Nhấn để bật/tắt nhanh quyền chấm bài"
                      className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {r.can_grade ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Có quyền chấm bài
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                          <XCircle className="h-3.5 w-3.5" />
                          Không
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        title="Chỉnh sửa cấp bậc"
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-blue-600 hover:bg-blue-500/10 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingRank(r);
                        }}
                        title="Xóa cấp bậc"
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-red-600 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── ADD RANK MODAL ─── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm cấp bậc cảnh sát mới"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="add-rank-form"
              disabled={savingAdd}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55]"
            >
              {savingAdd ? t('common.loading') : t('common.confirm')}
            </button>
          </div>
        }
      >
        <form id="add-rank-form" onSubmit={handleAddRank} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Sở Cảnh Sát áp dụng:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRankDept('sasp')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  rankDept === 'sasp'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/sasplogo.png" className="h-4 w-4 object-contain" />
                <span>SASP</span>
              </button>
              <button
                type="button"
                onClick={() => setRankDept('lspd')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  rankDept === 'lspd'
                    ? 'bg-sky-600/15 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/lspd.png" className="h-4 w-4 object-contain" />
                <span>LSPD</span>
              </button>
              <button
                type="button"
                onClick={() => setRankDept('bcso')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  rankDept === 'bcso'
                    ? 'bg-amber-600/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/sherifflogo.png" className="h-4 w-4 object-contain" />
                <span>BCSO</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Tên cấp bậc:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={rankName}
              onChange={(e) => setRankName(e.target.value)}
              placeholder="VD: Senior Trooper, Lieutenant, Sergeant..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Bậc (Số nguyên, cấp cao hơn có số lớn hơn):
            </label>
            <input
              type="number"
              required
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)] cursor-pointer">
            <input
              type="checkbox"
              checked={canGrade}
              onChange={(e) => setCanGrade(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600"
            />
            <span>Cho phép chấm bài thi (can_grade = true)</span>
          </label>
        </form>
      </Modal>

      {/* ─── EDIT RANK MODAL ─── */}
      <Modal
        isOpen={!!editingRank}
        onClose={() => setEditingRank(null)}
        title={`Chỉnh sửa cấp bậc: ${editingRank?.name}`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setEditingRank(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="edit-rank-form"
              disabled={savingEdit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55]"
            >
              {savingEdit ? t('common.loading') : 'Lưu thay đổi'}
            </button>
          </div>
        }
      >
        <form id="edit-rank-form" onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Sở Cảnh Sát trực thuộc:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEditDept('sasp')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  editDept === 'sasp'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/sasplogo.png" className="h-4 w-4 object-contain" />
                <span>SASP</span>
              </button>
              <button
                type="button"
                onClick={() => setEditDept('lspd')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  editDept === 'lspd'
                    ? 'bg-sky-600/15 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/lspd.png" className="h-4 w-4 object-contain" />
                <span>LSPD</span>
              </button>
              <button
                type="button"
                onClick={() => setEditDept('bcso')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  editDept === 'bcso'
                    ? 'bg-amber-600/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/sherifflogo.png" className="h-4 w-4 object-contain" />
                <span>BCSO</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Tên cấp bậc:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="VD: Senior Corporal, Lieutenant..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Bậc (Level):
            </label>
            <input
              type="number"
              required
              value={editLevel}
              onChange={(e) => setEditLevel(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)] cursor-pointer">
            <input
              type="checkbox"
              checked={editCanGrade}
              onChange={(e) => setEditCanGrade(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600"
            />
            <span>Cho phép chấm bài thi (can_grade = true)</span>
          </label>
        </form>
      </Modal>

      {/* ─── DELETE RANK CONFIRMATION MODAL ─── */}
      <Modal
        isOpen={!!deletingRank}
        onClose={() => {
          setDeletingRank(null);
          setDeleteError(null);
        }}
        title="Xác nhận xóa cấp bậc"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setDeletingRank(null);
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 shadow"
            >
              {deleting ? t('common.loading') : 'Xác nhận xóa'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Không thể xóa cấp bậc:</strong>
                <p className="leading-relaxed">{deleteError}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[var(--color-text)] leading-relaxed">
              Đồng chí có chắc chắn muốn xóa cấp bậc{' '}
              <strong className="text-red-600 dark:text-red-400 font-bold">
                {deletingRank?.name} (Bậc {deletingRank?.level})
              </strong>{' '}
              khỏi danh sách? Hành động này không thể hoàn tác.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
