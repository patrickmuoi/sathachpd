import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Shield,
  Award,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Check,
  Building2,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import type { UserCertificate } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ASSETS } from '../../assets';

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();

  const [grantedCerts, setGrantedCerts] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // File Inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const personalPhotoInputRef = useRef<HTMLInputElement>(null);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const myData = await api.get<{ granted: UserCertificate[] }>('/certificates/my');
      setGrantedCerts(myData.granted || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Convert File to base64 Data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload Avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh đại diện không được vượt quá 5MB');
      return;
    }

    try {
      setPhotoSaving(true);
      const base64 = await fileToBase64(file);
      await api.patch('/auth/profile-photos', { avatar_url: base64 });

      if (user) {
        const updated = { ...user, avatar_url: base64 };
        setUser(updated);
      }

      setSuccessToast('Đã cập nhật ảnh đại diện thành công!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật ảnh đại diện');
    } finally {
      setPhotoSaving(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Remove Avatar
  const handleRemoveAvatar = async () => {
    try {
      setPhotoSaving(true);
      await api.patch('/auth/profile-photos', { avatar_url: '' });

      if (user) {
        const updated = { ...user, avatar_url: undefined };
        setUser(updated);
      }

      setSuccessToast('Đã gỡ ảnh đại diện.');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gỡ ảnh');
    } finally {
      setPhotoSaving(false);
    }
  };

  // Upload Personal / Duty Photo
  const handlePersonalPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Dung lượng hình ảnh không được vượt quá 8MB');
      return;
    }

    try {
      setPhotoSaving(true);
      const base64 = await fileToBase64(file);
      await api.patch('/auth/profile-photos', { personal_photo_url: base64 });

      if (user) {
        const updated = { ...user, personal_photo_url: base64 };
        setUser(updated);
      }

      setSuccessToast('Đã lưu ảnh thẻ tác chiến & hình ảnh cá nhân!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu ảnh');
    } finally {
      setPhotoSaving(false);
      if (personalPhotoInputRef.current) personalPhotoInputRef.current.value = '';
    }
  };

  // Remove Personal Photo
  const handleRemovePersonalPhoto = async () => {
    try {
      setPhotoSaving(true);
      await api.patch('/auth/profile-photos', { personal_photo_url: '' });

      if (user) {
        const updated = { ...user, personal_photo_url: undefined };
        setUser(updated);
      }

      setSuccessToast('Đã xóa ảnh thẻ tác chiến.');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gỡ ảnh');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: t('auth.passwordMismatch', 'Mật khẩu xác nhận không trùng khớp'), isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setPwdMsg({ text: 'Mật khẩu mới phải có tối thiểu 6 ký tự', isError: true });
      return;
    }

    try {
      setPwdLoading(true);
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setPwdMsg({ text: t('auth.passwordChanged', 'Đổi mật khẩu thành công'), isError: false });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Lỗi đổi mật khẩu', isError: true });
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const isLspd = user?.department_id === 'lspd';
  const isBcso = user?.department_id === 'bcso';
  const isSasp = user?.department_id === 'sasp' || (!isBcso && !isLspd);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Profile Card with Avatar Upload */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Background accent badge */}
        <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-10 pointer-events-none w-64 h-64">
          <img
            src={ASSETS.getDepartmentLogo(user?.department_id)}
            alt="Watermark"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Area with Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-tr from-[#0b172b] to-[#1a3a6b] p-1 border-2 border-[#ffd700] flex items-center justify-center text-[#ffd700] text-3xl font-black shadow-xl overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <span>{user?.callsign.substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            {/* Hidden Avatar Input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {/* Hover overlay button to trigger upload */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={photoSaving}
              className="absolute inset-0 rounded-3xl bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs font-bold text-xs gap-1 cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              <Camera className="h-6 w-6 text-[#ffd700]" />
              <span className="text-[10px] text-slate-200">Đổi Avatar</span>
            </button>

            {/* Remove button if avatar exists */}
            {user?.avatar_url && (
              <button
                onClick={handleRemoveAvatar}
                disabled={photoSaving}
                className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow hover:bg-red-700 transition-colors"
                title="Gỡ ảnh đại diện"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Profile Details */}
          <div className="flex-1 text-center sm:text-left space-y-2.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#ffd700] text-[#0b172b] shadow-sm">
                {user?.callsign.toUpperCase()}
              </span>

              {/* Department Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black shadow-sm ${
                  isBcso
                    ? 'bg-amber-600/20 text-amber-700 dark:text-amber-300 border border-amber-600/30'
                    : isLspd
                    ? 'bg-sky-600/20 text-sky-700 dark:text-sky-300 border border-sky-600/30'
                    : 'bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-600/30'
                }`}
              >
                <img
                  src={ASSETS.getDepartmentLogo(user?.department_id)}
                  alt="Dept Logo"
                  className="h-3.5 w-3.5 object-contain"
                />
                <span>
                  {isLspd
                    ? 'Los Santos Police (LSPD)'
                    : isBcso
                    ? 'Blaine County Sheriff (BCSO)'
                    : 'San Andreas State Police (SASP)'}
                </span>
              </span>

              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a6b] text-[#ffd700]">
                {user?.role}
              </span>
            </div>

            <h1 className="text-2xl font-black text-[var(--color-text)]">
              {user?.fullName}
            </h1>

            {/* Jurisdiction Notice */}
            {isSasp && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                <Shield className="h-3.5 w-3.5" />
                <span>Thẩm quyền cấp Tiểu bang: Giám sát toàn bộ các sở cảnh sát & hồ sơ sĩ quan toàn bang.</span>
              </div>
            )}

            {isBcso && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-[11px] font-bold">
                <Shield className="h-3.5 w-3.5" />
                <span>Thẩm quyền Hạt Blaine: Phụ trách khu vực Sandy Shores, Paleto Bay và sa mạc Hạt Blaine.</span>
              </div>
            )}

            {isLspd && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-200 text-[11px] font-bold">
                <Shield className="h-3.5 w-3.5" />
                <span>Thẩm quyền Đô thị Los Santos: Phụ trách an ninh trật tự nội đô thành phố Los Santos và các quận thương mại.</span>
              </div>
            )}

            <div className="rounded-xl bg-[var(--color-bg)] p-3 border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text)] block mb-1">Ghi chú công tác & điều kiện trực ban:</strong>
              {user?.duty_note || 'Đã kiểm tra đủ điều kiện thường trực chiến đấu và dự thi sát hạch theo quy định của Sở.'}
            </div>

            {/* Action buttons for avatar upload */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={photoSaving}
                className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Camera className="h-3.5 w-3.5 text-[#ffd700]" />
                <span>Tải ảnh đại diện mới</span>
              </button>

              {user?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={photoSaving}
                  className="px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-all"
                >
                  Gỡ ảnh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED PERSONAL PHOTO & DUTY BADGE CARD */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
          <div>
            <h2 className="text-base font-black text-[var(--color-text)] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-amber-500" />
              Hình Ảnh Cá Nhân & Thẻ Ngành Sĩ Quan
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Hình ảnh thẻ tác chiến toàn thân hoặc ảnh chân dung nghiệp vụ lưu trữ chính thức trong hồ sơ sở cảnh sát.
            </p>
          </div>

          {/* Hidden Personal Photo Input */}
          <input
            ref={personalPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePersonalPhotoChange}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => personalPhotoInputRef.current?.click()}
              disabled={photoSaving}
              className="px-4 py-2 rounded-xl bg-[#1a3a6b] dark:bg-[#ffd700] text-white dark:text-[#060d17] text-xs font-bold hover:opacity-90 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Upload className="h-4 w-4" />
              <span>{user?.personal_photo_url ? 'Thay đổi ảnh' : 'Tải lên hình ảnh cá nhân'}</span>
            </button>

            {user?.personal_photo_url && (
              <button
                onClick={handleRemovePersonalPhoto}
                disabled={photoSaving}
                className="p-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold"
                title="Xóa ảnh cá nhân"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Photo Display Card */}
        {user?.personal_photo_url ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)]">
            <div className="w-full sm:w-56 h-72 rounded-2xl overflow-hidden border-2 border-[#ffd700]/50 shadow-md shrink-0 bg-slate-900">
              <img
                src={user.personal_photo_url}
                alt="Personal Duty Photo"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 text-xs w-full">
              <div className="flex items-center gap-3">
                <img
                  src={ASSETS.getDepartmentLogo(user?.department_id)}
                  alt="Badge"
                  className="h-10 w-10 object-contain shrink-0"
                />
                <div>
                  <p className="font-black text-sm text-[var(--color-text)] uppercase">{user.fullName}</p>
                  <p className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    CALLSIGN: {user.callsign.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)]">
                <div>
                  <span className="text-[var(--color-text-secondary)] block text-[10px] uppercase font-bold">Cơ quan trực thuộc:</span>
                  <span className="font-bold text-[var(--color-text)]">
                    {isLspd
                      ? 'Los Santos Police Department'
                      : isBcso
                      ? "Blaine County Sheriff's Office"
                      : 'San Andreas State Police'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)] block text-[10px] uppercase font-bold">Tình trạng hồ sơ:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" /> Đã xác thực
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[var(--color-text-secondary)] italic pt-1">
                Ảnh này được bảo mật và đối chiếu định danh tự động trong tất cả các phiên thi sát hạch nghiệp vụ và cấp chứng chỉ.
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => personalPhotoInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--color-border)] hover:border-[#ffd700] rounded-2xl p-8 text-center cursor-pointer bg-[var(--color-bg)]/50 transition-colors group"
          >
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-[var(--color-text)]">
              Chưa có hình ảnh cá nhân / ảnh thẻ tác chiến
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Bấm vào đây để tải ảnh thẻ chụp cùng quân phục hoặc trang bị đặc chủng của đồng chí (PNG, JPG tối đa 8MB).
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Certificates & Achievements */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
            <Award className="h-5 w-5 text-[#ffd700]" />
            <h2 className="text-base font-bold text-[var(--color-text)]">
              {t('profile.certList', 'Chứng chỉ chuyên môn đã đạt')} ({grantedCerts.length})
            </h2>
          </div>

          {grantedCerts.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] py-4">
              Chưa có chứng chỉ nào được ghi nhận. Đồng chí có thể đăng ký dự thi trong mục Chứng chỉ.
            </p>
          ) : (
            <div className="space-y-3">
              {grantedCerts.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs space-y-1"
                >
                  <p className="font-bold text-[var(--color-text)]">{c.certificate?.name}</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Cấp ngày: {new Date(c.granted_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
            <KeyRound className="h-5 w-5 text-[#ffd700]" />
            <h2 className="text-base font-bold text-[var(--color-text)]">
              {t('auth.changePassword', 'Đổi mật khẩu')}
            </h2>
          </div>

          {pwdMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                pwdMsg.isError
                  ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
              }`}
            >
              {pwdMsg.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-[var(--color-text)] font-semibold mb-1">
                {t('auth.oldPassword', 'Mật khẩu hiện tại')}
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
              />
            </div>

            <div>
              <label className="block text-[var(--color-text)] font-semibold mb-1">
                {t('auth.newPassword', 'Mật khẩu mới')}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
              />
            </div>

            <div>
              <label className="block text-[var(--color-text)] font-semibold mb-1">
                {t('auth.confirmPassword', 'Xác nhận mật khẩu mới')}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full py-2.5 rounded-xl font-bold bg-[#1a3a6b] dark:bg-[#ffd700] text-white dark:text-[#060d17] hover:opacity-90 disabled:opacity-50 transition-opacity mt-2 flex items-center justify-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{pwdLoading ? t('common.loading', 'Đang lưu...') : t('common.save', 'Lưu mật khẩu mới')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
