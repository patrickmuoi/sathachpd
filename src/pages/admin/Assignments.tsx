import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, User, BookOpen, AlertTriangle, CheckCircle2, X, ShieldAlert, Layers } from 'lucide-react';
import { api } from '../../lib/api';
import type { Exam, User as UserType, ExamAssignment } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ASSETS } from '../../assets';

export default function Assignments() {
  const { t } = useTranslation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [officers, setOfficers] = useState<UserType[]>([]);
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState<'all' | 'sasp' | 'bcso' | 'lspd'>('all');
  const [assigning, setAssigning] = useState(false);
  const [overrideWarn, setOverrideWarn] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eList, uList, aList] = await Promise.all([
        api.get<Exam[]>('/admin/exams'),
        api.get<UserType[]>('/admin/users'),
        api.get<ExamAssignment[]>('/admin/assignments'),
      ]);
      const published = eList.filter((e) => e.status === 'published');
      setExams(published);
      if (published.length > 0) setSelectedExamId(published[0].id);

      setOfficers(uList.filter((u) => u.roles.includes('OFFICER') && u.is_active));
      setAssignments(aList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOfficer = (id: string) => {
    if (selectedOfficerIds.includes(id)) {
      setSelectedOfficerIds(selectedOfficerIds.filter((item) => item !== id));
    } else {
      setSelectedOfficerIds([...selectedOfficerIds, id]);
    }
  };

  const filteredOfficers = officers.filter((o) => {
    if (deptFilter === 'all') return true;
    return o.department_id === deptFilter;
  });

  const filteredExams = exams.filter((e) => {
    if (deptFilter === 'all') return true;
    return !e.department_id || e.department_id === 'all' || e.department_id === deptFilter;
  });

  const filteredAssignments = assignments.filter((a) => {
    if (deptFilter === 'all') return true;
    return a.user?.department_id === deptFilter || a.exam?.department_id === deptFilter;
  });

  const handleSelectAll = () => {
    if (selectedOfficerIds.length === filteredOfficers.length) {
      setSelectedOfficerIds([]);
    } else {
      setSelectedOfficerIds(filteredOfficers.map((o) => o.id));
    }
  };

  const currentExam = exams.find((e) => e.id === selectedExamId);

  // Check if any selected officer has rank mismatch for promotion exam
  const hasRankMismatch =
    currentExam?.type === 'promotion' &&
    selectedOfficerIds.some((uid) => {
      const off = officers.find((o) => o.id === uid);
      return off && off.rank_id !== currentExam.target_rank_id;
    });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || selectedOfficerIds.length === 0) return;

    if (hasRankMismatch && !overrideWarn) {
      setOverrideWarn(true);
      return;
    }

    try {
      setAssigning(true);
      await api.post('/admin/assignments', {
        exam_id: selectedExamId,
        user_ids: selectedOfficerIds,
      });
      setSelectedOfficerIds([]);
      setOverrideWarn(false);
      await loadData();
      alert('Đã giao bài thi thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi giao bài thi');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20">
        <h1 className="text-2xl font-black">{t('admin.assignExam')}</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Lựa chọn đề thi đã công bố và chỉ định cán bộ sĩ quan thực hiện bài sát hạch theo từng sở cảnh sát (SASP / BCSO).
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
            Tất cả đơn vị ({assignments.length})
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Creation Form */}
        <form
          onSubmit={handleAssign}
          className="lg:col-span-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4 h-fit"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
            Phân công đề thi
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              Chọn đề thi phát hành:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)]"
            >
              {filteredExams.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.department_id ? e.department_id.toUpperCase() : 'ALL'}] [{e.type.toUpperCase()}] {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* Rank Mismatch Alert */}
          {hasRankMismatch && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>{t('admin.rankMismatchWarning')}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Đề thi thăng cấp yêu cầu cấp bậc cụ thể. Với vai trò Quản trị viên, đồng chí có quyền ghi đè để giao tiếp tục.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--color-text)]">
                Chọn sĩ quan ({selectedOfficerIds.length}/{filteredOfficers.length}):
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-[#ffd700] hover:underline font-bold"
              >
                {selectedOfficerIds.length === filteredOfficers.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[var(--color-border)] rounded-xl p-2 bg-[var(--color-bg)]">
              {filteredOfficers.map((off) => (
                <label
                  key={off.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-surface)] cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedOfficerIds.includes(off.id)}
                    onChange={() => handleToggleOfficer(off.id)}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[var(--color-text)]">{off.full_name}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black ${
                          off.department_id === 'bcso'
                            ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300'
                            : off.department_id === 'lspd'
                            ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300'
                            : 'bg-blue-600/15 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        <img
                          src={ASSETS.getDepartmentLogo(off.department_id)}
                          alt=""
                          className="h-2.5 w-2.5 object-contain"
                        />
                        {off.department_id ? off.department_id.toUpperCase() : 'SASP'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      {off.callsign} - {off.rank?.name || 'Chưa cấp'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={assigning || selectedOfficerIds.length === 0}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow disabled:opacity-40 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {hasRankMismatch && !overrideWarn
                ? 'Giao đề (Kiểm tra ghi đè)'
                : `Xác nhận giao cho ${selectedOfficerIds.length} sĩ quan`}
            </span>
          </button>
        </form>

        {/* Existing Assignments List */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
              Lịch sử giao bài thi ({filteredAssignments.length})
            </h2>
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              {deptFilter === 'all' ? 'Tất cả đơn vị' : deptFilter === 'sasp' ? 'SASP' : 'BCSO'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Sĩ quan</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3">Đề thi</th>
                  <th className="py-2.5 px-3">Ngày giao</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredAssignments.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface-hover)]">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[var(--color-text)]">{item.user?.full_name}</div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">
                        {item.user?.callsign}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.user?.department_id === 'bcso'
                            ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300'
                            : item.user?.department_id === 'lspd'
                            ? 'bg-sky-600/15 text-sky-700 dark:text-sky-300'
                            : 'bg-blue-600/15 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        <img
                          src={ASSETS.getDepartmentLogo(item.user?.department_id)}
                          alt=""
                          className="h-3 w-3 object-contain"
                        />
                        {item.user?.department_id ? item.user.department_id.toUpperCase() : 'SASP'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[var(--color-text)] truncate max-w-xs">
                        {item.exam?.title}
                      </div>
                      {item.exam?.department_id && (
                        <span
                          className={`text-[9px] font-bold uppercase ${
                            item.exam.department_id === 'bcso'
                              ? 'text-amber-500'
                              : item.exam.department_id === 'sasp'
                              ? 'text-blue-500'
                              : 'text-slate-400'
                          }`}
                        >
                          Sở: {item.exam.department_id === 'all' ? 'Toàn ngành' : item.exam.department_id.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">
                      {new Date(item.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1a3a6b]/10 text-[#1a3a6b] dark:text-[#ffd700]">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

