import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, CheckCircle2, Clock, XCircle, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import type { Certificate, CertificateRequest, UserCertificate } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

export default function Certificates() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [myRequests, setMyRequests] = useState<CertificateRequest[]>([]);
  const [grantedCerts, setGrantedCerts] = useState<UserCertificate[]>([]);

  // Register Modal
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [note, setNote] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCerts, myData] = await Promise.all([
        api.get<Certificate[]>('/certificates'),
        api.get<{ requests: CertificateRequest[]; granted: UserCertificate[] }>('/certificates/my'),
      ]);
      setCertificates(allCerts);
      setMyRequests(myData.requests || []);
      setGrantedCerts(myData.granted || []);
    } catch (err) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert) return;

    try {
      setRegistering(true);
      await api.post('/certificates/request', {
        certificateId: selectedCert.id,
        note: note.trim(),
      });
      setSelectedCert(null);
      setNote('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi đăng ký');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20">
        <h1 className="text-2xl font-black">{t('nav.certificates')}</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Hệ thống chứng chỉ nghiệp vụ đặc biệt của Sở. Sau khi đăng ký và được Quản trị duyệt, đồng chí sẽ được giao bài thi sát hạch để cấp chứng chỉ.
        </p>
      </div>

      {/* Granted Certificates Section */}
      {grantedCerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Chứng chỉ đã đạt được ({grantedCerts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grantedCerts.map((uc) => (
              <div
                key={uc.id}
                className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 shadow-sm space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-[#ffd700]" />
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                    CHỨNG CHỈ HỢP THỨC
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  {uc.certificate?.name}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {uc.certificate?.description}
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-2 border-t border-emerald-500/20">
                  Cấp ngày: {new Date(uc.granted_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Certificates Catalog */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
          Danh mục Chứng chỉ Chuyên môn Ngành
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => {
            const hasGranted = grantedCerts.some((g) => g.certificate_id === cert.id);
            const req = myRequests.find((r) => r.certificate_id === cert.id);

            return (
              <div
                key={cert.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-[#1a3a6b]/10 text-[#ffd700] flex items-center justify-center border border-[#ffd700]/30">
                      <Award className="h-5 w-5" />
                    </div>
                    {hasGranted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã có chứng chỉ
                      </span>
                    ) : req ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          req.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : req.status === 'approved'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}
                      >
                        {req.status === 'pending' ? (
                          <>
                            <Clock className="h-3.5 w-3.5" />
                            Chờ duyệt
                          </>
                        ) : req.status === 'approved' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Đã duyệt (Chờ giao bài)
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            Bị từ chối
                          </>
                        )}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-text)]">{cert.name}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                    {cert.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                  {!hasGranted && !req && (
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#1a3a6b] hover:bg-[#152e55] text-[#ffd700] shadow flex items-center justify-center gap-2"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{t('cert.register')}</span>
                    </button>
                  )}
                  {req?.status === 'pending' && (
                    <div className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Hồ sơ đăng ký đang chờ lãnh đạo phê duyệt
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title={t('cert.register')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setSelectedCert(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55]"
            >
              {registering ? t('common.loading') : t('common.confirm')}
            </button>
          </div>
        }
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="rounded-xl bg-[var(--color-bg)] p-3 border border-[var(--color-border)]">
            <h4 className="text-sm font-bold text-[var(--color-text)]">{selectedCert?.name}</h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {selectedCert?.description}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Ghi chú quá trình huấn luyện / Lý do đăng ký:
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã hoàn thành khóa huấn luyện bắn súng dã chiến tháng 2/2026..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

