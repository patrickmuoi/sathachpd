import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  Award,
  PlusCircle,
  Send,
  Layers,
  ArrowRight,
  Shield,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface AdminStats {
  totalOfficers: number;
  activeExams: number;
  pendingGrading: number;
  pendingAppeals: number;
  pendingCertRequests: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.get<AdminStats>('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Error loading admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const statCards = [
    {
      title: 'Tổng số cán bộ sĩ quan',
      count: stats?.totalOfficers || 0,
      icon: Users,
      color: 'from-blue-600 to-indigo-700',
      to: '/admin/accounts',
    },
    {
      title: 'Đề thi đã phát hành',
      count: stats?.activeExams || 0,
      icon: BookOpen,
      color: 'from-amber-500 to-yellow-600',
      to: '/admin/exams',
    },
    {
      title: 'Bài thi chờ chấm',
      count: stats?.pendingGrading || 0,
      icon: ClipboardCheck,
      color: 'from-purple-600 to-violet-700',
      to: '/grader/queue',
    },
    {
      title: 'Đơn phúc khảo chờ xử lý',
      count: stats?.pendingAppeals || 0,
      icon: AlertTriangle,
      color: 'from-red-600 to-rose-700',
      to: '/admin/appeals',
    },
    {
      title: 'Đăng ký chứng chỉ chờ duyệt',
      count: stats?.pendingCertRequests || 0,
      icon: Award,
      color: 'from-emerald-600 to-teal-700',
      to: '/admin/cert-approvals',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-xs font-bold mb-2 border border-[#ffd700]/30">
            <Shield className="h-3.5 w-3.5" />
            TRUNG TÂM CHỈ HUY QUẢN TRỊ SỞ
          </div>
          <h1 className="text-2xl font-black">{t('nav.dashboard')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Tổng quan dữ liệu sát hạch, phân công đề thi và theo dõi chống gian lận thời gian thực.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/create-account')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-[#060d17] hover:bg-slate-100 shadow flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <UserPlus className="h-4 w-4 text-[#1a3a6b]" />
            <span>Tạo tài khoản sĩ quan</span>
          </button>
          <button
            onClick={() => navigate('/admin/exams/create')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </button>
          <button
            onClick={() => navigate('/admin/certificates')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow flex items-center gap-1.5 transition-all"
          >
            <Award className="h-4 w-4 text-[#ffd700]" />
            <span>Quản lý chứng chỉ</span>
          </button>
          <button
            onClick={() => navigate('/admin/assignments')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow flex items-center gap-1.5 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Giao bài thi</span>
          </button>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(card.to)}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-secondary)] group-hover:text-[#ffd700] transition-colors" />
              </div>

              <div>
                <span className="text-3xl font-black text-[var(--color-text)]">{card.count}</span>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-1">
                  {card.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => navigate('/admin/accounts')}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:border-[#ffd700] transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
            <Users className="h-4 w-4" />
            Quản lý Tài khoản Cán bộ
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Tạo mới sĩ quan với mật khẩu tự sinh hiển thị 1 lần, đặt lại mật khẩu, thăng cấp bậc và khóa tài khoản khi cần thiết.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/exams')}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:border-[#ffd700] transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <BookOpen className="h-4 w-4" />
            Soạn thảo & Quản lý Đề thi
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Hỗ trợ 3 loại câu hỏi (Trắc nghiệm, Tự luận, Đúng/Sai có giải thích), kiểm tra tổng 10 điểm, nhân bản và khóa đề đã thi.
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/results-log')}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm hover:border-[#ffd700] transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
            <FileText className="h-4 w-4" />
            Nhật ký Giám sát & Chống gian lận
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Theo dõi dòng thời gian chi tiết từng lần chuyển tab, rời màn hình, thiết bị và lý do nộp bài của mọi lượt thi.
          </p>
        </div>
      </div>
    </div>
  );
}

