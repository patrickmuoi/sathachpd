import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, XCircle, Clock, User, FileText, Send } from 'lucide-react';
import { api } from '../../lib/api';
import type { Appeal } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function Appeals() {
  const { t } = useTranslation();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [decisionNote, setDecisionNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      const data = await api.get<Appeal[]>('/appeals');
      setAppeals(data);
    } catch (err) {
      console.error('Failed to load appeals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppeal) return;

    try {
      setSaving(true);
      await api.patch(`/appeals/${selectedAppeal.id}`, {
        status: decision,
        decided_note: decisionNote.trim(),
      });
      setSelectedAppeal(null);
      setDecisionNote('');
      await loadAppeals();
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý phúc khảo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20">
        <div className="flex items-center gap-2 text-[#ffd700] text-xs font-bold mb-1">
          <AlertTriangle className="h-4 w-4" />
          HỘI ĐỒNG PHÚC KHẢO & GIÁM SÁT KHIẾU NẠI
        </div>
        <h1 className="text-2xl font-black">{t('nav.appeals')}</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Xem xét các đơn đề nghị chấm lại bài thi của sĩ quan. Khi chấp thuận, bài thi sẽ được đưa trở lại hàng chờ để cán bộ khác chấm lại.
        </p>
      </div>

      {appeals.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 opacity-60 mb-3" />
          <h3 className="text-base font-bold text-[var(--color-text)]">Không có đơn phúc khảo nào</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Tất cả kết quả sát hạch đã được sĩ quan đồng thuận hoặc chưa có khiếu nại mới.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      item.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : item.status === 'approved'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                    }`}
                  >
                    {item.status === 'pending'
                      ? 'Chờ duyệt phúc khảo'
                      : item.status === 'approved'
                      ? 'Đã duyệt (Đưa về chấm lại)'
                      : 'Đã từ chối'}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Gửi ngày: {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <User className="h-3.5 w-3.5 text-[#ffd700]" />
                  <span>
                    Sĩ quan: <strong>{item.user?.full_name}</strong> ({item.user?.callsign})
                  </span>
                  <span>•</span>
                  <span>Điểm lần đầu: {item.previous_score ?? item.attempt?.final_score}đ</span>
                </div>

                <div className="rounded-xl bg-[var(--color-bg)] p-3 border border-[var(--color-border)] text-xs text-[var(--color-text)]">
                  <strong className="text-[var(--color-text-secondary)] block mb-0.5">Lý do phúc khảo:</strong>
                  {item.reason}
                </div>

                {item.decided_note && (
                  <p className="text-[11px] text-[var(--color-text-secondary)] italic">
                    Ghi chú của Hội đồng: {item.decided_note}
                  </p>
                )}
              </div>

              {item.status === 'pending' && (
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]">
                  <button
                    onClick={() => {
                      setSelectedAppeal(item);
                      setDecision('approved');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow"
                  >
                    Duyệt & Chấm lại
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAppeal(item);
                      setDecision('rejected');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow"
                  >
                    Bác bỏ
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={!!selectedAppeal}
        onClose={() => setSelectedAppeal(null)}
        title={decision === 'approved' ? 'Chấp thuận phúc khảo' : 'Từ chối phúc khảo'}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setSelectedAppeal(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDecide}
              disabled={saving}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${
                decision === 'approved' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {saving ? t('common.loading') : t('common.confirm')}
            </button>
          </div>
        }
      >
        <form onSubmit={handleDecide} className="space-y-4">
          <p className="text-xs text-[var(--color-text)]">
            {decision === 'approved'
              ? 'Khi chấp thuận, bài thi này sẽ tự động chuyển về Hàng chờ chấm thi để người chấm khác đánh giá lại độc lập.'
              : 'Xác nhận bác bỏ yêu cầu phúc khảo này.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Ghi chú lý do giải quyết của Hội đồng:
            </label>
            <textarea
              rows={3}
              required
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="VD: Chấp thuận chấm lại câu tự luận số 3 do căn cứ pháp luật bổ sung..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

