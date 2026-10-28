import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  LogOut,
  FileText,
  Award,
  User,
  ClipboardCheck,
  AlertTriangle,
  Users,
  UserPlus,
  BarChart3,
  BookOpen,
  Send,
  Shield,
  ChevronDown,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import ChatWidget from './ChatWidget';
import ToastContainer from './Toast';
import AppSidebar from './AppSidebar';
import { ASSETS } from '../assets';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build nav items depending on current role
  const role = user?.role || 'OFFICER';

  const officerNav = [
    { to: '/officer/exams', label: t('nav.myExams'), icon: BookOpen },
    { to: '/officer/results', label: t('nav.results'), icon: BarChart3 },
    { to: '/officer/certificates', label: t('nav.certificates'), icon: Award },
    { to: '/officer/profile', label: t('nav.profile'), icon: User },
  ];

  const graderNav = [
    { to: '/grader/queue', label: t('nav.gradingQueue'), icon: ClipboardCheck },
    { to: '/grader/appeals', label: t('nav.appeals'), icon: AlertTriangle },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: t('nav.dashboard'), icon: BarChart3 },
    { to: '/admin/create-account', label: t('nav.createOfficer'), icon: UserPlus },
    { to: '/admin/accounts', label: t('nav.accounts'), icon: Users },
    { to: '/admin/ranks', label: t('nav.ranks'), icon: Layers },
    { to: '/admin/certificates', label: t('nav.certAdmin'), icon: Award },
    { to: '/admin/exams', label: t('nav.exams'), icon: BookOpen },
    { to: '/admin/assignments', label: t('nav.assignments'), icon: Send },
    { to: '/admin/cert-approvals', label: t('nav.certApproval'), icon: GraduationCap },
    { to: '/admin/results-log', label: t('nav.resultsLog'), icon: FileText },
    { to: '/admin/appeals', label: t('nav.appeals'), icon: AlertTriangle },
  ];

  let currentNavItems = officerNav;
  if (role === 'GRADER') currentNavItems = graderNav;
  if (role === 'ADMIN') currentNavItems = adminNav;

  const roleLabels: Record<string, string> = {
    OFFICER: t('roles.officer'),
    GRADER: t('roles.grader'),
    ADMIN: t('roles.admin'),
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur shadow-sm px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Department Logo & Title */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#0b172b] to-[#1a3a6b] p-1 border border-[#ffd700]/50 shadow-md transition-transform group-hover:scale-105">
              <img
                src={ASSETS.getDepartmentLogo(user?.department_id)}
                alt="Police Department Emblem"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div className="hidden sm:block">
              <span className="block text-base font-black tracking-tight text-[#1a3a6b] dark:text-[#ffd700] leading-none">
                {user?.department_id === 'bcso'
                  ? 'BCSO PORTAL'
                  : user?.department_id === 'sasp'
                  ? 'SASP PORTAL'
                  : user?.department_id === 'lspd'
                  ? 'LSPD PORTAL'
                  : 'POLICE EXAM'}
              </span>
              <span className="block text-[10px] font-bold tracking-wider text-[var(--color-text-secondary)] uppercase mt-0.5">
                {user?.department_id === 'bcso'
                  ? "BLAINE COUNTY SHERIFF'S OFFICE"
                  : user?.department_id === 'sasp'
                  ? 'SAN ANDREAS STATE POLICE'
                  : user?.department_id === 'lspd'
                  ? 'LOS SANTOS POLICE DEPARTMENT'
                  : 'CỔNG THI SÁT HẠCH NỘI BỘ'}
              </span>
            </div>
          </NavLink>
        </div>

        {/* Right Action Tools: Language, Theme, Role, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Department badge */}
          {user?.department_id && (
            <span
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black shadow-sm ${
                user.department_id === 'bcso'
                  ? 'bg-amber-600/15 text-amber-700 dark:text-amber-400 border border-amber-600/30'
                  : user.department_id === 'lspd'
                  ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-600/30'
                  : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-600/30'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              {user.department_id.toUpperCase()}
            </span>
          )}

          {/* Role badge */}
          {user && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#1a3a6b]/10 dark:bg-[#ffd700]/10 text-[#1a3a6b] dark:text-[#ffd700] border border-[#1a3a6b]/20 dark:border-[#ffd700]/20">
              <Shield className="h-3.5 w-3.5" />
              {roleLabels[user.role] || user.role}
            </span>
          )}

          {/* User Account Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none"
                aria-expanded={userMenuOpen}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#1a3a6b] to-[#2a5298] text-[#ffd700] flex items-center justify-center font-bold text-xs shadow overflow-hidden border border-[#ffd700]/30">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    user.callsign.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold leading-tight truncate max-w-[100px]">
                    {user.callsign}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-[100px]">
                    {user.fullName}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-secondary)]">Số hiệu / Callsign</p>
                    <p className="text-sm font-bold text-[#1a3a6b] dark:text-[#ffd700] uppercase">
                      {user.callsign}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                      {user.fullName}
                    </p>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => navigate('/officer/profile')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                    >
                      <User className="h-4 w-4 text-[#ffd700]" />
                      <span>{t('nav.profile')}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('common.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 rounded-lg bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] font-semibold text-xs shadow transition-all"
            >
              {t('common.login')}
            </button>
          )}
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:flex">
          <AppSidebar items={currentNavItems} roleLabel={roleLabels[role]} />
        </div>

        {/* Mobile Slide-in Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Drawer */}
            <div className="relative w-72 max-w-[80vw] h-full bg-[var(--color-surface)] p-6 shadow-2xl flex flex-col border-r border-[var(--color-border)] animate-in slide-in-from-left">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-4">
                <div className="flex items-center gap-2">
                  <img src={ASSETS.pdLogo} alt="PD Logo" className="h-8 w-8" />
                  <span className="font-extrabold text-sm text-[#1a3a6b] dark:text-[#ffd700]">
                    POLICE EXAM
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {currentNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-[#1a3a6b] text-[#ffd700] shadow'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {user && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/10 text-red-600 font-bold text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Global Interactive Elements */}
      <ChatWidget />
      <ToastContainer />
    </div>
  );
}

