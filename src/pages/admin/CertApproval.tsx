import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, RefreshCw, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { CertificateRequest } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CertApproval() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests(true);

    // 1. Supabase Realtime channel subscription
    const channel = supabase
      ?.channel('cert_approvals_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'certificate_requests' },
        () => {
          loadRequests(false);
        }
      )
      .subscribe();

    // 2. Continuous background polling (every 3 seconds) for instant sync
    const interval = setInterval(() => {
      loadRequests(false);
    }, 3000);

    return () => {
      if (channel) supabase?.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadRequests = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const data = await api.get<CertificateRequest[]>('/admin/cert-requests');
      setRequests(data || []);
    } catch (e) {
      console.error('Lỗi nạp yêu cầu chứng chỉ:', e);
    } finally {
      if (isInitial) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDecide = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/cert-requests/${id}`, { status });
      await loadRequests(false);
    } catch (e) {
      console.error('Lỗi cập nhật trạng thái yêu cầu:', e);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const filtered = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black">{t('nav.certApproval')}</h1>
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Realtime</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Phê duyệt hồ sơ đăng ký thi lấy chứng chỉ nghiệp vụ đặc thù của cán bộ chiến sĩ. Hệ thống tự động cập nhật liên tục với database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => loadRequests(false)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-white/10"
            title="Đồng bộ dữ liệu ngay lập tức"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#ffd700]' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          <button
            onClick={() => navigate('/admin/certificates')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Award className="h-4 w-4" />
            <span>Quản lý danh mục</span>
          </button>

          {/* Filter buttons with real counts */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: `Tất cả (${requests.length})` },
                { id: 'pending', label: `Chờ duyệt (${pendingCount})` },
                { id: 'approved', label: `Đã duyệt (${approvedCount})` },
                { id: 'rejected', label: `Bị từ chối (${rejectedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.id ? 'bg-[#ffd700] text-[#060d17]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)] text-xs space-y-2">
            <Award className="h-10 w-10 mx-auto text-[var(--color-text-secondary)] opacity-30" />
            <p className="font-semibold text-sm text-[var(--color-text)]">
              {filter === 'all'
                ? 'Hiện chưa có hồ sơ đăng ký chứng chỉ nào từ cán bộ chiến sĩ.'
                : filter === 'pending'
                ? 'Không có hồ sơ nào đang chờ phê duyệt.'
                : filter === 'approved'
                ? 'Chưa có hồ sơ nào được phê duyệt.'
                : 'Không có hồ sơ nào bị từ chối.'}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Khi cán bộ chiến sĩ đăng ký chứng chỉ từ trang cá nhân, hồ sơ sẽ lập tức xuất hiện tại đây theo thời gian thực.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Sĩ quan</th>
                <th className="py-3 px-4">Chứng chỉ đăng ký</th>
                <th className="py-3 px-4">Ghi chú huấn luyện</th>
                <th className="py-3 px-4">Ngày gửi</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Phê duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[var(--color-text)]">
                      {r.user?.full_name || 'Cán bộ chiến sĩ'}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                      Số hiệu: {r.user?.callsign || 'N/A'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[var(--color-text)]">
                    <div className="inline-flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-[#ffd700]" />
                      <span>{r.certificate?.name || 'Chứng chỉ chuyên môn'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-text-secondary)] max-w-xs truncate">
                    {r.note ? (
                      <span className="italic">"{r.note}"</span>
                    ) : (
                      <span className="opacity-50">Không có ghi chú</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-text-secondary)]">
                    {new Date(r.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                      }`}
                    >
                      {r.status === 'pending'
                        ? 'Chờ duyệt'
                        : r.status === 'approved'
                        ? 'Đã duyệt'
                        : 'Bị từ chối'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {r.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDecide(r.id, 'approved')}
                          title="Chấp thuận & Mở đề thi"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 font-bold flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Duyệt</span>
                        </button>
                        <button
                          onClick={() => handleDecide(r.id, 'rejected')}
                          title="Từ chối yêu cầu"
                          className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border border-red-500/30 font-bold flex items-center gap-1 transition-all active:scale-95"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--color-text-secondary)] italic">
                        Đã xử lý
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
