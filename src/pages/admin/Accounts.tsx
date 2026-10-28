import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Award,
  Copy,
  Check,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Crown,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import type { User, Rank, Role } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { ASSETS } from '../../assets';

export default function Accounts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<'all' | 'sasp' | 'bcso' | 'lspd'>('all');

  // Edit Officer Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRankId, setEditRankId] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<'sasp' | 'bcso' | 'lspd'>('sasp');
  const [editRoles, setEditRoles] = useState<Role[]>(['OFFICER']);
  const [editDutyNote, setEditDutyNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Officer Modal
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // One-time Password Reveal Modal
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [revealedForUser, setRevealedForUser] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, rList] = await Promise.all([
        api.get<User[]>('/admin/users'),
        api.get<Rank[]>('/admin/ranks'),
      ]);
      setUsers(uList);
      setRanks(rList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Direct quick-set rank from table dropdown
  const handleQuickSetRank = async (u: User, newRankId: string) => {
    try {
      await api.patch(`/admin/users/${u.id}`, { rank_id: newRankId });
      // Update local state smoothly
      setUsers((prev) =>
        prev.map((userItem) => {
          if (userItem.id === u.id) {
            const foundRank = ranks.find((r) => r.id === newRankId);
            return { ...userItem, rank_id: newRankId, rank: foundRank };
          }
          return userItem;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật cấp bậc');
      await loadData();
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditName(u.full_name);
    setEditRankId(u.rank_id);
    setEditDepartmentId((u.department_id as 'sasp' | 'bcso' | 'lspd') || 'sasp');
    setEditRoles(u.roles || ['OFFICER']);
    setEditDutyNote(u.duty_note || '');
  };

  // Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim() || !editRankId) return;

    try {
      setSavingEdit(true);
      await api.patch(`/admin/users/${editingUser.id}`, {
        full_name: editName.trim(),
        department_id: editDepartmentId,
        rank_id: editRankId,
        roles: editRoles,
        duty_note: editDutyNote.trim(),
      });
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật thông tin cán bộ');
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle Role in Edit Modal
  const handleRoleToggle = (role: Role) => {
    if (editRoles.includes(role)) {
      if (editRoles.length === 1) return; // at least 1 role
      setEditRoles(editRoles.filter((r) => r !== role));
    } else {
      setEditRoles([...editRoles, role]);
    }
  };

  // Toggle active/locked
  const handleToggleActive = async (u: User) => {
    if (u.callsign.toLowerCase() === 'admin') {
      alert('Không thể khóa tài khoản Quản trị viên tối cao (root admin)!');
      return;
    }
    try {
      await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset password
  const handleResetPassword = async (u: User) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let newPwd = 'PD@';
    for (let i = 0; i < 7; i++) {
      newPwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    if (confirm(`Đặt lại mật khẩu cho cán bộ sĩ quan ${u.full_name} (${u.callsign})?`)) {
      try {
        await api.post(`/admin/users/${u.id}/reset-password`, { new_password: newPwd });
        setRevealedForUser(`${u.full_name} (${u.callsign})`);
        setRevealedPassword(newPwd);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi đặt lại mật khẩu');
      }
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (u: User) => {
    if (u.callsign.toLowerCase() === 'admin') {
      alert('Bảo vệ hệ thống: Không thể xóa tài khoản Quản trị viên tối cao (root admin)!');
      return;
    }
    if (u.id === currentUser?.userId) {
      alert('Không thể tự xóa tài khoản đang đăng nhập!');
      return;
    }
    setDeleteError(null);
    setDeletingUser(u);
  };

  // Execute Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteError(null);

    try {
      setDeleting(true);
      await api.delete(`/admin/users/${deletingUser.id}`);
      setDeletingUser(null);
      await loadData();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError(err.message || 'Không thể xóa tài khoản này');
      }
    } finally {
      setDeleting(false);
    }
  };

  const copyPassword = () => {
    if (!revealedPassword) return;
    navigator.clipboard.writeText(revealedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSaspOrAdmin =
    !currentUser ||
    currentUser.roles.includes('ADMIN') ||
    currentUser.department_id === 'sasp';

  const filteredUsers = users.filter((u) => {
    if (deptFilter !== 'all' && u.department_id !== deptFilter) return false;
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.callsign.toLowerCase().includes(q) ||
      (u.rank?.name && u.rank.name.toLowerCase().includes(q))
    );
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header with Superadmin Authority Badge */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/20 text-[#ffd700] text-xs font-black mb-2 border border-[#ffd700]/40">
            <Crown className="h-4 w-4" />
            <span>HỆ THỐNG PHÂN QUYỀN ĐA SỞ (SASP & BCSO)</span>
          </div>
          <h1 className="text-2xl font-black">{t('nav.accounts')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Quản lý sĩ quan, thiết lập cấp bậc đặc thù theo từng sở cảnh sát (San Andreas State Police & Blaine County Sheriff).
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/create-account')}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-2 shrink-0 transition-transform active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>{t('admin.createAccount')}</span>
        </button>
      </div>

      {/* State-wide Oversight Badge if SASP/Admin */}
      {isSaspOrAdmin && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between gap-3 text-blue-700 dark:text-blue-300">
          <div className="flex items-center gap-2.5 font-bold">
            <img src="/sasplogo.png" alt="SASP" className="h-5 w-5 object-contain" />
            <span>Thẩm quyền Tiểu Bang (SASP): Sĩ quan có toàn quyền giám sát và xem toàn bộ hồ sơ nhân sự của mọi đơn vị (SASP, LSPD và BCSO).</span>
          </div>
        </div>
      )}

      {/* Search and Department Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, số hiệu callsign hoặc cấp bậc..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
          />
        </div>

        {/* Department Filter Tabs (Available for SASP and Admin) */}
        {isSaspOrAdmin ? (
          <div className="flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setDeptFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                deptFilter === 'all'
                  ? 'bg-[#1a3a6b] dark:bg-[#ffd700] text-white dark:text-[#060d17] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              Tất cả các sở ({users.length})
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
              <span>SASP ({users.filter((u) => u.department_id === 'sasp').length})</span>
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
              <span>LSPD ({users.filter((u) => u.department_id === 'lspd').length})</span>
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
              <span>BCSO ({users.filter((u) => u.department_id === 'bcso').length})</span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300">
            <img src={ASSETS.getDepartmentLogo(currentUser?.department_id)} alt="Dept" className="h-4 w-4 object-contain" />
            <span>Phạm vi hiển thị: Nội bộ {currentUser?.department_id?.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* User Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Tên Sĩ Quan</th>
                <th className="py-3.5 px-4">Sở Trực Thuộc</th>
                <th className="py-3.5 px-4">Callsign</th>
                <th className="py-3.5 px-4">Cấp bậc</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredUsers.map((u) => {
                const isRootAdmin = u.callsign.toLowerCase() === 'admin';
                const isBcsoUser = u.department_id === 'bcso';

                // Lọc cấp bậc khả dụng tương ứng với sở của sĩ quan
                const availableRanksForUser = ranks.filter(
                  (r) => !r.department_id || r.department_id === 'all' || r.department_id === u.department_id
                );

                return (
                  <tr key={u.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#1a3a6b] to-[#2a5298] text-[#ffd700] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#ffd700]/30 shadow-sm">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} className="h-full w-full object-cover" />
                          ) : (
                            u.callsign.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {isRootAdmin && <Crown className="h-3.5 w-3.5 text-[#ffd700] shrink-0" />}
                            <span className="font-bold text-[var(--color-text)]">{u.full_name}</span>
                          </div>
                          <div className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-xs mt-0.5">
                            {u.duty_note || 'Chưa có ghi chú trực ban'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black shadow-xs ${
                          isBcsoUser
                            ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border border-amber-600/30'
                            : u.department_id === 'lspd'
                            ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-600/30'
                            : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-600/30'
                        }`}
                      >
                        <img
                          src={ASSETS.getDepartmentLogo(u.department_id)}
                          alt="Dept"
                          className="h-3.5 w-3.5 object-contain"
                        />
                        <span>{u.department_id?.toUpperCase() || 'SASP'}</span>
                      </span>
                    </td>

                    {/* Callsign */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-amber-600 dark:text-[#ffd700] bg-[var(--color-bg)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                        {u.callsign}
                      </span>
                    </td>

                    {/* Direct Rank Dropdown Selector */}
                    <td className="py-3.5 px-4">
                      <select
                        value={u.rank_id}
                        onChange={(e) => handleQuickSetRank(u, e.target.value)}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-1.5 px-2.5 text-xs font-bold text-[var(--color-text)] focus:ring-2 focus:ring-[#ffd700] cursor-pointer hover:border-[#ffd700] transition-colors"
                        title="Nhấn để đổi ngay cấp bậc cho sĩ quan này"
                      >
                        {availableRanksForUser.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} (Bậc {r.level}) {r.can_grade ? '★' : ''}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Roles Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r === 'ADMIN'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-[#ffd700] border border-amber-500/30'
                                : r === 'GRADER'
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                : 'bg-[#1a3a6b]/10 text-[#1a3a6b] dark:text-[#8aa3ff] border border-[#1a3a6b]/20'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Officer Profile Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="Chỉnh sửa thông tin, cấp bậc & vai trò"
                          className="p-1.5 rounded-lg border border-[var(--color-border)] text-blue-600 hover:bg-blue-500/10 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          title="Cấp lại mật khẩu mới"
                          className="p-1.5 rounded-lg border border-[var(--color-border)] text-amber-600 hover:bg-amber-500/10 transition-colors"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>

                        {/* Lock / Unlock Button */}
                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                            className={`p-1.5 rounded-lg border border-[var(--color-border)] ${
                              u.is_active
                                ? 'text-amber-600 hover:bg-amber-500/10'
                                : 'text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.is_active ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                        )}

                        {/* Delete Officer Button */}
                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(u)}
                            title="Xóa vĩnh viễn tài khoản sĩ quan này"
                            className="p-1.5 rounded-lg border border-[var(--color-border)] text-red-600 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── EDIT OFFICER PROFILE & ROLES MODAL ─── */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Chỉnh sửa sĩ quan: ${editingUser?.full_name} (${editingUser?.callsign})`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="edit-user-form"
              disabled={savingEdit}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55]"
            >
              {savingEdit ? t('common.loading') : 'Lưu thay đổi'}
            </button>
          </div>
        }
      >
        <form id="edit-user-form" onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Họ và tên cán bộ sĩ quan:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
          </div>

          {/* Department Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Sở Cảnh Sát trực thuộc:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditDepartmentId('sasp');
                  const saspRanks = ranks.filter((r) => !r.department_id || r.department_id === 'all' || r.department_id === 'sasp');
                  if (saspRanks.length > 0 && !saspRanks.some((r) => r.id === editRankId)) {
                    setEditRankId(saspRanks[0].id);
                  }
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  editDepartmentId === 'sasp'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/sasplogo.png" alt="SASP" className="h-4 w-4 object-contain" />
                <span>SASP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditDepartmentId('lspd');
                  const lspdRanks = ranks.filter((r) => !r.department_id || r.department_id === 'all' || r.department_id === 'lspd');
                  if (lspdRanks.length > 0 && !lspdRanks.some((r) => r.id === editRankId)) {
                    setEditRankId(lspdRanks[0].id);
                  }
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  editDepartmentId === 'lspd'
                    ? 'bg-sky-600/15 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/lspd.png" alt="LSPD" className="h-4 w-4 object-contain" />
                <span>LSPD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditDepartmentId('bcso');
                  const bcsoRanks = ranks.filter((r) => !r.department_id || r.department_id === 'all' || r.department_id === 'bcso');
                  if (bcsoRanks.length > 0 && !bcsoRanks.some((r) => r.id === editRankId)) {
                    setEditRankId(bcsoRanks[0].id);
                  }
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  editDepartmentId === 'bcso'
                    ? 'bg-amber-600/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                }`}
              >
                <img src="/sherifflogo.png" alt="BCSO" className="h-4 w-4 object-contain" />
                <span>BCSO</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Cấp bậc biên chế:
            </label>
            <select
              value={editRankId}
              onChange={(e) => setEditRankId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            >
              {ranks
                .filter(
                  (r) => !r.department_id || r.department_id === 'all' || r.department_id === editDepartmentId
                )
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Bậc {r.level}) {r.can_grade ? '— Có thẩm quyền chấm bài' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
              Vai trò trong hệ thống:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'OFFICER', label: 'Sĩ quan' },
                { id: 'GRADER', label: 'Cán bộ chấm' },
                { id: 'ADMIN', label: 'Quản trị' },
              ].map((item) => {
                const isChecked = editRoles.includes(item.id as Role);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRoleToggle(item.id as Role)}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-[#1a3a6b] text-[#ffd700] border-[#1a3a6b]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isChecked && <Check className="h-3.5 w-3.5 text-[#ffd700]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Ghi chú công tác & điều kiện trực ban (`duty_note`):
            </label>
            <textarea
              rows={2}
              value={editDutyNote}
              onChange={(e) => setEditDutyNote(e.target.value)}
              placeholder="Ghi nhận điều kiện trực ca, số giờ tuần tra..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
          </div>
        </form>
      </Modal>

      {/* ─── DELETE OFFICER CONFIRMATION MODAL ─── */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => {
          setDeletingUser(null);
          setDeleteError(null);
        }}
        title="Xác nhận xóa tài khoản sĩ quan"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setDeletingUser(null);
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
              {deleting ? t('common.loading') : 'Xác nhận xóa tài khoản'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong className="block font-bold mb-1">Không thể xóa tài khoản:</strong>
                <p className="leading-relaxed">{deleteError}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-[var(--color-text)] leading-relaxed">
                Đồng chí có chắc chắn muốn xóa vĩnh viễn tài khoản sĩ quan:
              </p>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs space-y-1">
                <p>
                  Họ và tên: <strong className="text-[var(--color-text)]">{deletingUser?.full_name}</strong>
                </p>
                <p>
                  Số hiệu (Callsign):{' '}
                  <strong className="font-mono text-amber-600 dark:text-[#ffd700]">
                    {deletingUser?.callsign}
                  </strong>
                </p>
                <p>
                  Cấp bậc: <strong>{deletingUser?.rank?.name || 'Chưa xếp'}</strong>
                </p>
              </div>
              <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                ⚠️ Hành động này sẽ hủy bỏ các bài thi được giao và xóa toàn bộ thông tin đăng nhập của cán bộ này.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* ─── ONE-TIME PASSWORD REVEAL MODAL ─── */}
      <Modal
        isOpen={!!revealedPassword}
        onClose={() => setRevealedPassword(null)}
        title="🔑 MẬT KHẨU MỚI CHO SĨ QUAN"
        footer={
          <button
            onClick={() => setRevealedPassword(null)}
            className="w-full py-2.5 rounded-xl bg-[#1a3a6b] text-[#ffd700] font-bold text-xs"
          >
            Tôi đã sao chép an toàn
          </button>
        }
      >
        <div className="space-y-4 text-center p-2">
          <p className="text-xs text-[var(--color-text)] font-semibold">
            Tài khoản cán bộ: <span className="text-[#ffd700] font-bold">{revealedForUser}</span>
          </p>
          <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
            {t('admin.passwordShownOnce')} Hãy gửi mật khẩu này cho sĩ quan.
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)]">
            <span className="font-mono text-xl font-black text-amber-600 dark:text-[#ffd700] tracking-wider select-all">
              {revealedPassword}
            </span>
            <button
              onClick={copyPassword}
              className="p-2 rounded-xl bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] flex items-center gap-1.5 text-xs font-bold shadow"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
