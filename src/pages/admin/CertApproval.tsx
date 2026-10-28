import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, CheckCircle2, XCircle, Clock, User, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { CertificateRequest } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CertApproval() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.get<CertificateRequest[]>('/admin/cert-requests');
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/cert-requests/${id}`, { status });
      await loadRequests();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const filtered = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">{t('nav.certApproval')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Phê duyệt hồ sơ đăng ký thi lấy chứng chỉ nghiệp vụ đặc thù của cán bộ chiến sĩ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/certificates')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Award className="h-4 w-4" />
            <span>Quản lý danh mục chứng chỉ</span>
          </button>

          {/* Filter buttons */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === tab ? 'bg-[#ffd700] text-[#060d17]' : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab === 'all'
                ? 'Tất cả'
                : tab === 'pending'
                ? 'Chờ duyệt'
                : tab === 'approved'
                ? 'Đã duyệt'
                : 'Bị từ chối'}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-secondary)] text-xs">
            Không có yêu cầu đăng ký chứng chỉ nào trong mục này.
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
                <tr key={r.id} className="hover:bg-[var(--color-surface-hover)]">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[var(--color-text)]">{r.user?.full_name}</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {r.user?.callsign}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[var(--color-text)]">
                    {r.certificate?.name}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-text-secondary)] max-w-xs truncate">
                    {r.note || 'Không có ghi chú'}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-text-secondary)]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          : r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-600 border-red-500/30'
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
                    {r.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDecide(r.id, 'approved')}
                          title="Chấp thuận"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDecide(r.id, 'rejected')}
                          title="Từ chối"
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
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

