import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { api, ApiError } from '../lib/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { ASSETS } from '../assets';
import type { Role } from '../lib/types';
import FloatingLabelInput from '../components/FloatingLabelInput';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [callsign, setCallsign] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('OFFICER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ user: any }>('/auth/login', {
        callsign: callsign.trim().toLowerCase(),
        password,
        role,
      });

      setUser(res.user);

      // Route to initial role landing
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'GRADER') {
        navigate('/grader/queue');
      } else {
        navigate('/officer/exams');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#060d17] via-[#0b172b] to-[#152e55] text-white p-4 sm:p-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#ffd700]" />
          <span className="text-xs font-bold tracking-widest text-[#ffd700] uppercase">
            POLICE DEPARTMENT MẠNG NỘI BỘ
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur rounded-xl p-1 border border-white/10">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="relative rounded-3xl border border-[#ffd700]/30 bg-[#0f2340]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden">
          {/* Gold accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#ffd700] to-amber-300" />

          {/* Department Logo Header with SASP, LSPD & BCSO */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#060d17] to-[#1a3a6b] p-2 shadow-lg border border-[#ffd700]/40 flex items-center justify-center">
                <img src={ASSETS.saspLogo} alt="SASP Logo" className="h-full w-full object-contain" />
              </div>
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#0b172b] to-[#0f2c4c] p-2 shadow-lg border border-sky-400/50 flex items-center justify-center">
                <img src={ASSETS.lspdLogo} alt="LSPD Logo" className="h-full w-full object-contain" />
              </div>
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#1a1205] to-[#422507] p-2 shadow-lg border border-amber-500/50 flex items-center justify-center">
                <img src={ASSETS.sheriffLogo} alt="BCSO Sheriff Logo" className="h-full w-full object-contain" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1.5">
              <span>SASP</span>
              <span>•</span>
              <span>LSPD</span>
              <span>•</span>
              <span>BCSO</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Cổng Thi Sát Hạch & Nghiệp Vụ Cảnh Sát
            </h1>
            <p className="text-xs text-amber-200/80 mt-1 font-medium">
              San Andreas State Police • Los Santos Police Department • Blaine County Sheriff's Office
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/15 p-3.5 flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Callsign Input */}
            <FloatingLabelInput
              id="login-callsign"
              label={t('auth.callsign')}
              type="text"
              required
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toLowerCase())}
              placeholder="e.g. officer99, admin"
              leadingIcon={<UserIcon className="h-4 w-4" />}
              autoComplete="username"
            />

            {/* Password Input */}
            <FloatingLabelInput
              id="login-password"
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leadingIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              trailingAction={(
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="u025-action"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            />

            {/* Role Radio Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('auth.selectRole')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'OFFICER', label: t('roles.officer') },
                  { id: 'GRADER', label: t('roles.grader') },
                  { id: 'ADMIN', label: t('roles.admin') },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as Role)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${role === item.id
                        ? 'bg-[#ffd700] text-[#060d17] border-[#ffd700] shadow-md'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-[#ffd700] hover:from-amber-600 hover:to-amber-400 text-[#060d17] shadow-xl hover:shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" />
              <span>{loading ? t('common.loading') : t('auth.login')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="text-center text-[11px] text-slate-400">
        © 2026 Hệ thống thông tin thi Police. Bảo mật nội bộ.
      </footer>
    </div>
  );
}

