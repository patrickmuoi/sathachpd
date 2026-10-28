import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Smartphone,
  Monitor,
  Eye,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Attempt, AntiCheatEvent } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { ASSETS } from '../../assets';

export default function ResultsLog() {
  const { t } = useTranslation();
  const [results, setResults] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<'all' | 'sasp' | 'bcso' | 'lspd'>('all');

  // Anti-cheat Timeline Modal
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [auditEvents, setAuditEvents] = useState<AntiCheatEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await api.get<Attempt[]>('/admin/results');
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAudit = async (att: Attempt) => {
    setSelectedAttempt(att);
    try {
      setAuditLoading(true);
      const events = await api.get<AntiCheatEvent[]>(`/admin/results/${att.id}/audit`);
      setAuditEvents(events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  };

  const filteredResults = results.filter((att) => {
    if (deptFilter === 'all') return true;
    return att.user?.department_id === deptFilter || att.exam?.department_id === deptFilter;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20">
        <h1 className="text-2xl font-black">{t('nav.resultsLog')}</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Theo dõi toàn bộ lịch sử sát hạch, phân tích điểm số và trích xuất nhật ký chống gian lận (Anti-Cheat Timeline Audit).
        </p>

        {/* Department Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10 mt-4">
          <span className="text-xs text-slate-300 flex items-center gap-1.5 mr-2 font-bold">
            <Layers className="h-4 w-4 text-[#ffd700]" />
            Lọc theo sở:
          </span>
          <button
            type="button"
            onClick={() => setDeptFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              deptFilter === 'all'
                ? 'bg-[#ffd700] text-[#102240] shadow-md shadow-[#ffd700]/20 font-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Tất cả đơn vị ({results.length})
          </button>
          <button
            type="button"
            onClick={() => setDeptFilter('sasp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              deptFilter === 'sasp'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-[#ffd700]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <img src={ASSETS.saspLogo} alt="" className="h-3.5 w-3.5 object-contain" />
            <span>SASP (Cảnh sát tiểu bang)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeptFilter('lspd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              deptFilter === 'lspd'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30 ring-2 ring-[#ffd700]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <img src={ASSETS.lspdLogo} alt="" className="h-3.5 w-3.5 object-contain" />
            <span>LSPD (Cảnh sát Los Santos)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeptFilter('bcso')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              deptFilter === 'bcso'
                ? 'bg-amber-700 text-white shadow-md shadow-amber-600/30 ring-2 ring-[#ffd700]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <img src={ASSETS.sheriffLogo} alt="" className="h-3.5 w-3.5 object-contain" />
            <span>BCSO (Văn phòng Cảnh sát trưởng)</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-text-secondary)]">
            Không có bài thi nào phù hợp với bộ lọc đơn vị.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Mã bài thi</th>
                  <th className="py-3 px-4">Sĩ quan</th>
                  <th className="py-3 px-4">Đơn vị</th>
                  <th className="py-3 px-4">Đề thi</th>
                  <th className="py-3 px-4">Điểm số</th>
                  <th className="py-3 px-4">Kết quả</th>
                  <th className="py-3 px-4">Hình thức nộp</th>
                  <th className="py-3 px-4 text-right">Giám sát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredResults.map((att) => (
                  <tr key={att.id} className="hover:bg-[var(--color-surface-hover)]">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-[#ffd700]">
                      {att.exam_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[var(--color-text)]">
                        {att.user?.full_name || att.user_id}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">
                        {att.user?.callsign}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.user?.department_id === 'bcso'
                            ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border border-amber-600/30'
                            : att.user?.department_id === 'lspd'
                            ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-600/30'
                            : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-600/30'
                        }`}
                      >
                        <img
                          src={ASSETS.getDepartmentLogo(att.user?.department_id)}
                          alt=""
                          className="h-3 w-3 object-contain"
                        />
                        <span>{att.user?.department_id ? att.user.department_id.toUpperCase() : 'SASP'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--color-text)] max-w-xs truncate">
                      <div>{att.exam?.title}</div>
                      {att.exam?.department_id && (
                        <span
                          className={`text-[9px] font-bold uppercase ${
                            att.exam.department_id === 'bcso'
                              ? 'text-amber-500'
                              : att.exam.department_id === 'sasp'
                              ? 'text-blue-500'
                              : 'text-slate-400'
                          }`}
                        >
                          Sở: {att.exam.department_id === 'all' ? 'Toàn ngành' : att.exam.department_id.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm">
                      {att.final_score ?? att.auto_score ?? '—'}
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-normal"> / 10đ</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {att.status === 'graded' ? (
                        att.passed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ĐẠT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                            <XCircle className="h-3.5 w-3.5" />
                            KHÔNG ĐẠT
                          </span>
                        )
                      ) : (
                        <span className="text-amber-600 font-semibold">Chờ chấm</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.submit_reason === 'cheating_auto_submit'
                            ? 'bg-red-500/10 text-red-600 border border-red-500/30'
                            : att.submit_reason === 'timeout'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}
                      >
                        {att.submit_reason === 'cheating_auto_submit'
                          ? 'Tự nộp do gian lận'
                          : att.submit_reason === 'timeout'
                          ? 'Hết giờ tự nộp'
                          : 'Tự nộp chủ động'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenAudit(att)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:border-[#ffd700] text-[var(--color-text)] font-semibold inline-flex items-center gap-1 text-xs"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-[#ffd700]" />
                        <span>Nhật ký</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Anti-Cheat Audit Timeline Modal */}
      <Modal
        isOpen={!!selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
        title={`🛡️ NHẬT KÝ GIÁM SÁT THI • MÃ: ${selectedAttempt?.exam_code}`}
        footer={
          <button
            onClick={() => setSelectedAttempt(null)}
            className="w-full py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700]"
          >
            {t('common.close')}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--color-bg)] p-3 border border-[var(--color-border)] text-xs flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 font-bold">
                <span>{selectedAttempt?.user?.full_name}</span>
                <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">
                  ({selectedAttempt?.user?.callsign})
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                Hình thức kết thúc: <strong className="text-[var(--color-text)]">{selectedAttempt?.submit_reason}</strong>
              </p>
            </div>
            {selectedAttempt?.user?.department_id && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  selectedAttempt.user.department_id === 'bcso'
                    ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border border-amber-600/30'
                    : selectedAttempt.user.department_id === 'lspd'
                    ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300 border border-sky-600/30'
                    : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-600/30'
                }`}
              >
                <img
                  src={ASSETS.getDepartmentLogo(selectedAttempt.user.department_id)}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
                <span>{selectedAttempt.user.department_id.toUpperCase()}</span>
              </span>
            )}
          </div>

          {auditLoading ? (
            <LoadingSpinner size="sm" />
          ) : auditEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-600 font-semibold flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8" />
              <span>Không phát hiện bất kỳ sự kiện rời tab hoặc gian lận nào trong suốt phiên thi.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              <h4 className="text-xs font-bold uppercase text-[var(--color-text-secondary)]">
                Dòng thời gian sự kiện ({auditEvents.length}):
              </h4>
              <div className="space-y-2 border-l-2 border-[#ffd700] pl-4 ml-2">
                {auditEvents.map((ev) => (
                  <div key={ev.id} className="text-xs space-y-0.5 relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600 dark:text-red-400 uppercase text-[10px]">
                        [{ev.type}] {ev.reason}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        {new Date(ev.occurred_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--color-text)] flex items-center gap-2">
                      {ev.device === 'mobile' ? (
                        <Smartphone className="h-3 w-3" />
                      ) : (
                        <Monitor className="h-3 w-3" />
                      )}
                      <span>Thiết bị: {ev.device}</span>
                      {ev.away_seconds ? (
                        <span>• Vắng mặt: {ev.away_seconds.toFixed(1)}s</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

