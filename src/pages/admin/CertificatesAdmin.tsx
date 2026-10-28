import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Clock,
  BookOpen,
  Users,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  Power,
  RefreshCw,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import type { Certificate } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function CertificatesAdmin() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createError, setCreateError] = useState('');

  // Edit Modal State
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState('');

  // Delete Modal State
  const [deletingCert, setDeletingCert] = useState<Certificate | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await api.get<Certificate[]>('/admin/certificates');
      setCertificates(data);
    } catch (err: any) {
      console.error('Error loading certificates', err);
      setErrorMessage(err.message || 'Không thể tải danh sách chứng chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateIsActive(true);
    setCreateError('');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setCreateError('Vui lòng nhập tên chứng chỉ nghiệp vụ');
      return;
    }

    try {
      setActionLoading(true);
      setCreateError('');
      await api.post<Certificate>('/admin/certificates', {
        name: createName.trim(),
        description: createDescription.trim(),
        is_active: createIsActive,
      });

      setIsCreateOpen(false);
      setSuccessMessage(`Đã tạo thành công chứng chỉ "${createName.trim()}"`);
      setTimeout(() => setSuccessMessage(''), 4000);
      await loadCertificates();
    } catch (err: any) {
      setCreateError(err.message || 'Không thể tạo chứng chỉ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (cert: Certificate) => {
    setEditingCert(cert);
    setEditName(cert.name);
    setEditDescription(cert.description || '');
    setEditIsActive(cert.is_active);
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    if (!editName.trim()) {
      setEditError('Tên chứng chỉ không được để trống');
      return;
    }

    try {
      setActionLoading(true);
      setEditError('');
      await api.patch<Certificate>(`/admin/certificates/${editingCert.id}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        is_active: editIsActive,
      });

      setEditingCert(null);
      setSuccessMessage(`Đã cập nhật chứng chỉ "${editName.trim()}"`);
      setTimeout(() => setSuccessMessage(''), 4000);
      await loadCertificates();
    } catch (err: any) {
      setEditError(err.message || 'Không thể cập nhật chứng chỉ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (cert: Certificate) => {
    try {
      const nextStatus = !cert.is_active;
      await api.patch<Certificate>(`/admin/certificates/${cert.id}`, {
        is_active: nextStatus,
      });
      setSuccessMessage(
        nextStatus
          ? `Đã kích hoạt chứng chỉ "${cert.name}"`
          : `Đã tạm dừng chứng chỉ "${cert.name}"`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadCertificates();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi thay đổi trạng thái');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleOpenDelete = (cert: Certificate) => {
    setDeletingCert(cert);
    setDeleteError('');
  };

  const handleDeleteSubmit = async () => {
    if (!deletingCert) return;

    try {
      setActionLoading(true);
      setDeleteError('');
      await api.delete(`/admin/certificates/${deletingCert.id}`);

      setSuccessMessage(`Đã xóa vĩnh viễn chứng chỉ "${deletingCert.name}"`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setDeletingCert(null);
      await loadCertificates();
    } catch (err: any) {
      setDeleteError(err.message || 'Không thể xóa chứng chỉ');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List
  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'active') return c.is_active;
      if (statusFilter === 'inactive') return !c.is_active;
      return true;
    });
  }, [certificates, searchQuery, statusFilter]);

  // Aggregate stats
  const totalCerts = certificates.length;
  const activeCerts = certificates.filter((c) => c.is_active).length;
  const totalHolders = certificates.reduce((sum, c) => sum + (c.holdersCount || 0), 0);
  const totalPendingRequests = certificates.reduce((sum, c) => sum + (c.pendingRequestsCount || 0), 0);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-xs font-bold mb-2 border border-[#ffd700]/30">
            <Award className="h-3.5 w-3.5" />
            HỆ THỐNG ĐÀO TẠO & CHỨNG CHỈ SỞ CẢNH SÁT
          </div>
          <h1 className="text-2xl font-black">Quản lý Chứng chỉ Nghiệp vụ</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Tạo mới, phân loại và quản lý các chứng chỉ chuyên ngành đặc thù (vũ khí, lái xe đặc chủng, sơ cứu, trinh sát...).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/cert-approvals')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow flex items-center gap-2 transition-all relative"
          >
            <Clock className="h-4 w-4 text-[#ffd700]" />
            <span>Duyệt hồ sơ đăng ký</span>
            {totalPendingRequests > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                {totalPendingRequests}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo chứng chỉ mới</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">Tổng chứng chỉ</p>
            <p className="text-2xl font-black text-[#1a3a6b] dark:text-[#ffd700] mt-1">{totalCerts}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">Đang hiệu lực</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCerts}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">Cán bộ đã đạt</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalHolders}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">Đơn chờ duyệt</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalPendingRequests}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mô tả chứng chỉ..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] dark:focus:ring-[#ffd700]"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto bg-[var(--color-bg)] p-1 rounded-xl border border-[var(--color-border)]">
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab
                  ? 'bg-[#1a3a6b] text-white dark:bg-[#ffd700] dark:text-[#060d17] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab === 'all' ? 'Tất cả' : tab === 'active' ? 'Đang hiệu lực' : 'Tạm dừng'}
            </button>
          ))}
        </div>
      </div>

      {/* Certificates List / Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {filteredCerts.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)] text-xs">
            <Award className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold">Không tìm thấy chứng chỉ nào phù hợp</p>
            <p className="mt-1 text-[11px]">Đồng chí có thể bấm nút "Tạo chứng chỉ mới" ở góc trên để bổ sung.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Chứng chỉ nghiệp vụ</th>
                  <th className="py-3.5 px-4">Mô tả & Tiêu chuẩn</th>
                  <th className="py-3.5 px-4 text-center">Liên kết</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[var(--color-surface-hover)] transition-colors group">
                    {/* Certificate Name & Code */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/30 text-amber-600 dark:text-[#ffd700] border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--color-text)] leading-snug">{cert.name}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-[var(--color-text-secondary)]">
                            ID: {cert.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4 align-top max-w-md">
                      <p className="text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                        {cert.description || <span className="italic text-slate-400">Chưa có mô tả chi tiết</span>}
                      </p>
                    </td>

                    {/* Stats & Links */}
                    <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center gap-1 text-[11px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold">
                          <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                          <span>{cert.examsCount || 0} đề thi</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] text-[var(--color-text-secondary)]">
                          <Users className="h-3 w-3 text-emerald-500" />
                          <span>{cert.holdersCount || 0} cán bộ sở hữu</span>
                        </span>
                      </div>
                    </td>

                    {/* Status Badge & Quick Toggle */}
                    <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(cert)}
                        title="Bấm để bật/tắt trạng thái hiệu lực"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-transform active:scale-95 cursor-pointer shadow-sm"
                        style={{
                          backgroundColor: cert.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                          color: cert.is_active ? '#10b981' : '#64748b',
                          border: `1px solid ${cert.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                        }}
                      >
                        {cert.is_active ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Hiệu lực</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Tạm dừng</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cert)}
                          className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors"
                          title="Chỉnh sửa chứng chỉ"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleOpenDelete(cert)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Xóa chứng chỉ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !actionLoading && setIsCreateOpen(false)}
        title="Tạo chứng chỉ nghiệp vụ mới"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCreateSubmit}
              className="px-4 py-2 rounded-xl bg-[#1a3a6b] dark:bg-[#ffd700] text-white dark:text-[#060d17] text-xs font-bold hover:opacity-90 shadow flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Tạo chứng chỉ</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Tên chứng chỉ nghiệp vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="VD: Sử dụng Vũ khí Quân dụng Cấp 1, Lái xe Đặc chủng..."
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] dark:focus:ring-[#ffd700]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Mô tả chi tiết & Tiêu chuẩn sát hạch
            </label>
            <textarea
              rows={4}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Ghi rõ tiêu chuẩn kỹ thuật, năng lực tác chiến, hoặc điều kiện để sĩ quan được cấp chứng chỉ..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] dark:focus:ring-[#ffd700]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--color-text)]">Trạng thái kích hoạt</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Cho phép sĩ quan nộp hồ sơ đăng ký và gắn đề thi sát hạch ngay lập tức.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={createIsActive}
                onChange={(e) => setCreateIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a3a6b] dark:peer-checked:bg-[#ffd700]"></div>
            </label>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingCert}
        onClose={() => !actionLoading && setEditingCert(null)}
        title="Chỉnh sửa thông tin chứng chỉ"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setEditingCert(null)}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleEditSubmit}
              className="px-4 py-2 rounded-xl bg-[#1a3a6b] dark:bg-[#ffd700] text-white dark:text-[#060d17] text-xs font-bold hover:opacity-90 shadow flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Tên chứng chỉ nghiệp vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] dark:focus:ring-[#ffd700]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Mô tả chi tiết & Tiêu chuẩn sát hạch
            </label>
            <textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] dark:focus:ring-[#ffd700]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--color-text)]">Trạng thái kích hoạt</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                {editIsActive ? 'Đang mở đăng ký cho toàn thể sĩ quan' : 'Tạm dừng không tiếp nhận đăng ký mới'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a3a6b] dark:peer-checked:bg-[#ffd700]"></div>
            </label>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingCert}
        onClose={() => !actionLoading && setDeletingCert(null)}
        title="Xác nhận xóa chứng chỉ"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setDeletingCert(null)}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteSubmit}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow flex items-center gap-1.5"
            >
              {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Xác nhận xóa vĩnh viễn</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Không thể thực hiện xóa:</p>
                <p className="mt-1">{deleteError}</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold">Cảnh báo bảo mật hệ thống:</p>
                <p className="mt-1">
                  Đồng chí có chắc chắn muốn xóa chứng chỉ{' '}
                  <span className="font-bold underline text-amber-950 dark:text-amber-100">{deletingCert?.name}</span>?
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Mã chứng chỉ:</span>
              <span className="font-mono font-bold text-[var(--color-text)]">{deletingCert?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Số đề thi đang dùng:</span>
              <span className="font-bold text-[var(--color-text)]">{deletingCert?.examsCount || 0} đề thi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Số cán bộ đã được cấp:</span>
              <span className="font-bold text-[var(--color-text)]">{deletingCert?.holdersCount || 0} cán bộ</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

