import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  Shield,
  KeyRound,
  Check,
  Copy,
  AlertCircle,
  ArrowLeft,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Rank, Role, User } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AccountCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loadingRanks, setLoadingRanks] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [departmentId, setDepartmentId] = useState<'sasp' | 'bcso' | 'lspd'>('sasp');
  const [rankId, setRankId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['OFFICER']);
  const [dutyNote, setDutyNote] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [useAutoPassword, setUseAutoPassword] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state after creation
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRanks();
  }, []);

  const loadRanks = async () => {
    try {
      setLoadingRanks(true);
      const data = await api.get<Rank[]>('/admin/ranks');
      setRanks(data);
      if (data.length > 0) setRankId(data[0].id);
    } catch (e) {
      console.error('Failed to load ranks', e);
    } finally {
      setLoadingRanks(false);
    }
  };

  const handleRoleToggle = (role: Role) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // at least 1 role
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normCallsign = callsign.trim().toLowerCase();
    if (!fullName.trim() || !normCallsign || !rankId) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        full_name: fullName.trim(),
        callsign: normCallsign,
        department_id: departmentId,
        rank_id: rankId,
        roles: selectedRoles,
        duty_note: dutyNote.trim() || undefined,
      };

      if (!useAutoPassword && customPassword.trim()) {
        payload.custom_password = customPassword.trim();
      }

      const res = await api.post<{ user: User; initialPassword?: string }>('/admin/users', payload);

      setCreatedUser(res.user);
      setRevealedPassword(res.initialPassword || customPassword || '123456');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo tài khoản sĩ quan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (!revealedPassword) return;
    navigator.clipboard.writeText(revealedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForm = () => {
    setCreatedUser(null);
    setRevealedPassword(null);
    setFullName('');
    setCallsign('');
    setDutyNote('');
    setCustomPassword('');
    setSelectedRoles(['OFFICER']);
    if (ranks.length > 0) setRankId(ranks[0].id);
  };

  if (loadingRanks) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/accounts')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Danh sách tài khoản sĩ quan</span>
        </button>

        <button
          onClick={() => navigate('/admin/accounts')}
          className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold flex items-center gap-1.5"
        >
          <Users className="h-3.5 w-3.5 text-[#ffd700]" />
          <span>Xem tất cả sĩ quan</span>
        </button>
      </div>

      {/* Hero Title Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-xs font-bold mb-2 border border-[#ffd700]/30">
            <UserPlus className="h-3.5 w-3.5" />
            QUẢN LÝ NHÂN SỰ VÀ BIÊN CHẾ
          </div>
          <h1 className="text-2xl font-black">{t('admin.createAccount')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Khởi tạo tài khoản chiến sĩ mới, xếp cấp bậc, phân quyền và cấp mật khẩu ban đầu hiển thị một lần duy nhất.
          </p>
        </div>
      </div>

      {/* SUCCESS CARD / ACCOUNT SLIP REVEAL */}
      {createdUser && revealedPassword ? (
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 via-[var(--color-surface)] to-[var(--color-surface)] p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg mb-1">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
              Khởi Tạo Tài Khoản Sĩ Quan Thành Công!
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Dưới đây là phiếu thông tin tài khoản và mật khẩu khởi tạo để bàn giao cho sĩ quan.
            </p>
          </div>

          {/* One-time Warning Box */}
          <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">LƯU Ý BẢO MẬT QUAN TRỌNG:</strong>
              {t('admin.passwordShownOnce')} Sau khi rời trang này, mật khẩu thô sẽ không thể xem lại được nữa. Sĩ quan có thể tự đổi mật khẩu sau khi đăng nhập.
            </div>
          </div>

          {/* Account Credential Slip */}
          <div className="rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-6 space-y-4 font-sans shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                PHIẾU BÀN GIAO TÀI KHOẢN NỘI BỘ SỞ
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[var(--color-text-secondary)] block">Họ và tên sĩ quan:</span>
                <span className="text-sm font-bold text-[var(--color-text)]">{createdUser.full_name}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)] block">Số hiệu (Callsign đăng nhập):</span>
                <span className="text-base font-black font-mono text-[#1a3a6b] dark:text-[#ffd700]">
                  {createdUser.callsign}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)] block">Cấp bậc & Đơn vị:</span>
                <span className="font-bold text-[var(--color-text)]">
                  {ranks.find((r) => r.id === createdUser.rank_id)?.name || 'Chưa xếp'} ({createdUser.department_id?.toUpperCase() || 'SASP'})
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)] block">Vai trò hệ thống:</span>
                <span className="font-bold text-[var(--color-text)]">
                  {createdUser.roles.join(', ')}
                </span>
              </div>
            </div>

            {/* Password highlight box */}
            <div className="pt-3 border-t border-[var(--color-border)]">
              <span className="text-xs font-bold text-[var(--color-text-secondary)] block mb-1.5">
                Mật khẩu khởi tạo:
              </span>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-surface)] border-2 border-emerald-500/50">
                <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider select-all">
                  {revealedPassword}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="px-4 py-2 rounded-xl bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép mật khẩu'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Tiếp tục tạo sĩ quan khác</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/accounts')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span>Về danh sách tài khoản</span>
            </button>
          </div>
        </div>
      ) : (
        /* CREATION FORM */
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm space-y-6"
        >
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Personnel Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#ffd700]" />
              Thông tin nhân sự sĩ quan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                  {t('admin.fullName')} <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Sĩ quan Jack Takahashi"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                  {t('auth.callsign')} (Tên đăng nhập chữ thường) <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toLowerCase())}
                  placeholder="VD: 333"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-xs sm:text-sm font-mono text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                />
                <span className="text-[11px] text-[var(--color-text-secondary)] mt-1 block">
                  Số hiệu là duy nhất trong toàn sở, tự động chuyển về chữ thường.
                </span>
              </div>
            </div>
          </div>

          {/* Department Selection */}
          <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#ffd700]" />
              Chọn Sở Cảnh Sát trực thuộc <span className="text-red-500">*</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDepartmentId('sasp');
                  const saspRanks = ranks.filter((r) => !r.department_id || r.department_id === 'all' || r.department_id === 'sasp');
                  if (saspRanks.length > 0) setRankId(saspRanks[0].id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${departmentId === 'sasp'
                  ? 'bg-blue-600/15 border-blue-500 text-blue-800 dark:text-blue-200 shadow-md ring-2 ring-blue-500/30'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
              >
                <div className="h-9 w-9 rounded-xl bg-blue-900/40 p-1 flex items-center justify-center shrink-0 border border-blue-400/30">
                  <img src="/sasplogo.png" alt="SASP Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <div className="font-black text-xs text-[var(--color-text)]">SASP State Police</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">Thẩm quyền toàn bang</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepartmentId('lspd');
                  const lspdRanks = ranks.filter((r) => !r.department_id || r.department_id === 'all' || r.department_id === 'lspd');
                  if (lspdRanks.length > 0) setRankId(lspdRanks[0].id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${departmentId === 'lspd'
                  ? 'bg-sky-600/15 border-sky-500 text-sky-800 dark:text-sky-200 shadow-md ring-2 ring-sky-500/30'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
              >
                <div className="h-9 w-9 rounded-xl bg-sky-900/40 p-1 flex items-center justify-center shrink-0 border border-sky-400/30">
                  <img src="/lspd.png" alt="LSPD Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <div className="font-black text-xs text-[var(--color-text)]">LSPD Police</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">Đô thị Los Santos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepartmentId('bcso');
                  const bcsoRanks = ranks.filter((r) => !r.department_id || r.department_id === 'all' || r.department_id === 'bcso');
                  if (bcsoRanks.length > 0) setRankId(bcsoRanks[0].id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${departmentId === 'bcso'
                  ? 'bg-amber-600/15 border-amber-500 text-amber-800 dark:text-amber-200 shadow-md ring-2 ring-amber-500/30'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
              >
                <div className="h-9 w-9 rounded-xl bg-amber-900/40 p-1 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <img src="/sherifflogo.png" alt="BCSO Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <div className="font-black text-xs text-[var(--color-text)]">BCSO Sheriff</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">Hạt Blaine & Sa mạc</div>
                </div>
              </button>
            </div>
          </div>

          {/* Rank & Roles */}
          <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
              <Award className="h-4 w-4 text-[#ffd700]" />
              Cấp bậc & Phân quyền hệ thống
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                  {t('admin.assignRank')} ({departmentId.toUpperCase()}) <span className="text-red-500">*</span>:
                </label>
                <select
                  value={rankId}
                  onChange={(e) => setRankId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                >
                  {ranks
                    .filter((r) => !r.department_id || r.department_id === 'all' || r.department_id === departmentId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Bậc {r.level}) {r.can_grade ? '— Có thẩm quyền chấm bài' : ''}
                      </option>
                    ))}
                </select>
                <span className="text-[11px] text-[var(--color-text-secondary)] mt-1 block">
                  Danh sách cấp bậc được tự động đồng bộ theo Sở {departmentId.toUpperCase()}.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                  {t('admin.assignRoles')} (chọn ít nhất 1 vai trò):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'OFFICER', label: 'Sĩ quan', desc: 'Làm bài thi' },
                    { id: 'GRADER', label: 'Cán bộ chấm', desc: 'Chấm bài' },
                    { id: 'ADMIN', label: 'Quản trị', desc: 'Toàn quyền' },
                  ].map((item) => {
                    const isChecked = selectedRoles.includes(item.id as Role);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRoleToggle(item.id as Role)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${isChecked
                          ? 'bg-[#1a3a6b]/10 border-[#1a3a6b] dark:bg-[#ffd700]/10 dark:border-[#ffd700] ring-1 ring-[#ffd700]/40'
                          : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[var(--color-text)]">{item.label}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                        </div>
                        <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Duty Note */}
          <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
            <label className="block text-xs font-semibold text-[var(--color-text)]">
              Ghi chú công tác & điều kiện trực ban:
            </label>
            <textarea
              rows={2}
              value={dutyNote}
              onChange={(e) => setDutyNote(e.target.value)}
              placeholder="VD: Đã hoàn thành 150 giờ tuần tra đêm, đủ điều kiện dự thi thăng cấp..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
            <span className="text-[11px] text-[var(--color-text-secondary)] block">
              Admin tự kiểm tra điều kiện này trước khi phân công đề thi. Sĩ quan sẽ nhìn thấy ghi chú này trong hồ sơ cá nhân.
            </span>
          </div>

          {/* Password Options */}
          <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#ffd700]" />
                Thiết lập mật khẩu khởi tạo
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseAutoPassword(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${useAutoPassword
                    ? 'bg-[#1a3a6b] text-[#ffd700]'
                    : 'border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                >
                  Tự tạo mật khẩu ngẫu nhiên (Khuyên dùng)
                </button>
                <button
                  type="button"
                  onClick={() => setUseAutoPassword(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!useAutoPassword
                    ? 'bg-[#1a3a6b] text-[#ffd700]'
                    : 'border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                >
                  Nhập mật khẩu riêng
                </button>
              </div>
            </div>

            {useAutoPassword ? (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Hệ thống sẽ tự động tạo một mật khẩu ngẫu nhiên có độ dài 10 ký tự bảo mật cao và hiển thị cho đồng chí sau khi bấm xác nhận.
                </span>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Nhập mật khẩu khởi tạo (tối thiểu 6 ký tự)..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/accounts')}
              className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-bold hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-[#ffd700] hover:from-amber-600 hover:to-amber-400 text-[#060d17] shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              <span>{submitting ? t('common.loading') : 'Tạo tài khoản sĩ quan mới'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

