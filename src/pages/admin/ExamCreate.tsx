import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Eye,
  Save,
  Send,
  CheckCircle2,
  ArrowLeft,
  Check,
  CheckSquare,
  PenTool,
  Cpu,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Exam, Question, Rank, Certificate, ExamType, QuestionType, QuestionOption } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ExamCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Basic Info
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState<'all' | 'sasp' | 'bcso' | 'lspd'>('all');
  const [type, setType] = useState<ExamType>('general');
  const [targetRankId, setTargetRankId] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passScore, setPassScore] = useState(5);

  // Lists for dropdowns
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);

  // Questions Builder
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q-new-1',
      exam_id: '',
      order_index: 1,
      type: 'mcq',
      text: 'Trình bày quy trình kiểm tra phương tiện cơ giới đường bộ khi phát hiện dấu hiệu vi phạm?',
      points: 4,
      options: [
        { id: 'opt-1', text: 'Chào điều lệnh công an, thông báo lý do dừng xe, kiểm tra giấy tờ người lái và phương tiện' },
        { id: 'opt-2', text: 'Yêu cầu người vi phạm nộp phạt bằng tiền mặt ngay tại chỗ không cần biên lai' },
        { id: 'opt-3', text: 'Tạm giữ ngay phương tiện giao thông mà không cần lập biên bản' },
        { id: 'opt-4', text: 'Cho phép người vi phạm tiếp tục di chuyển mà không ghi lại thông tin' },
      ],
      correct_option_id: 'opt-1',
      grader_note: 'Căn cứ Thông tư 32/2023/TT-BCA về quy trình tuần tra kiểm soát giao thông đường bộ.',
      min_words: 0,
    },
    {
      id: 'q-new-2',
      exam_id: '',
      order_index: 2,
      type: 'essay',
      text: 'Đồng chí hãy nêu các biện pháp nghiệp vụ phòng chống tội phạm công nghệ cao và bảo vệ an ninh trật tự trong giai đoạn hiện nay.',
      points: 6,
      grader_note: 'Tiêu chuẩn chấm điểm: 1. Nắm bắt các phương thức thủ đoạn tội phạm mạng mới (3đ); 2. Phối hợp với các tổ chức tín dụng, ngân hàng, nhà mạng để phong tỏa tài khoản và xác minh dòng tiền (3đ). Yêu cầu tối thiểu 20 từ.',
      min_words: 20,
    },
  ]);

  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadAuxData();
  }, []);

  const loadAuxData = async () => {
    try {
      const [rList, cList] = await Promise.all([
        api.get<Rank[]>('/admin/ranks'),
        api.get<Certificate[]>('/certificates'),
      ]);
      setRanks(rList);
      setCerts(cList);
      if (rList.length > 0) setTargetRankId(rList[0].id);
      if (cList.length > 0) setCertificateId(cList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddQuestion = (qType: QuestionType) => {
    const qId = 'q-' + Date.now();
    let initialOptions: QuestionOption[] | undefined = undefined;
    let initialCorrectId: string | undefined = undefined;

    if (qType === 'mcq') {
      const opt1Id = 'opt-' + Date.now() + '-1';
      const opt2Id = 'opt-' + Date.now() + '-2';
      const opt3Id = 'opt-' + Date.now() + '-3';
      const opt4Id = 'opt-' + Date.now() + '-4';
      initialOptions = [
        { id: opt1Id, text: '' },
        { id: opt2Id, text: '' },
        { id: opt3Id, text: '' },
        { id: opt4Id, text: '' },
      ];
      initialCorrectId = opt1Id; // Mặc định chọn phương án A làm đáp án đúng ban đầu
    }

    const newQ: Question = {
      id: qId,
      exam_id: '',
      order_index: questions.length + 1,
      type: qType,
      text: '',
      points: qType === 'mcq' ? 2 : 4,
      options: initialOptions,
      correct_option_id: initialCorrectId,
      correct_boolean: qType === 'true_false_explain' ? true : undefined,
      grader_note: '',
      min_words: qType === 'essay' ? 20 : 0,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Đề thi phải có ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const copy = [...questions];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setQuestions(copy);
  };

  // Add Option to MCQ question
  const handleAddOption = (qIdx: number) => {
    const copy = [...questions];
    const q = copy[qIdx];
    if (!q.options) q.options = [];
    const newOptId = 'opt-' + Date.now() + '-' + (q.options.length + 1);
    q.options.push({ id: newOptId, text: '' });
    if (!q.correct_option_id) {
      q.correct_option_id = newOptId;
    }
    setQuestions(copy);
  };

  // Remove Option from MCQ question
  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    const copy = [...questions];
    const q = copy[qIdx];
    if (!q.options || q.options.length <= 2) {
      alert('Câu hỏi trắc nghiệm phải có tối thiểu 2 phương án đáp án.');
      return;
    }
    const removedOpt = q.options[optIdx];
    q.options.splice(optIdx, 1);
    // Nếu xóa trúng đáp án đúng đang chọn, chuyển sang option đầu tiên
    if (q.correct_option_id === removedOpt.id) {
      q.correct_option_id = q.options[0]?.id;
    }
    setQuestions(copy);
  };

  // Select correct option for MCQ
  const handleSelectCorrectOption = (qIdx: number, optId: string) => {
    const copy = [...questions];
    copy[qIdx].correct_option_id = optId;
    setQuestions(copy);
  };

  // Calculations
  const autoScoreTotal = questions
    .filter((q) => q.type === 'mcq')
    .reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const manualScoreTotal = questions
    .filter((q) => q.type !== 'mcq')
    .reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const totalPoints = autoScoreTotal + manualScoreTotal;

  const handleSubmit = async (status: 'draft' | 'published') => {
    setFormError(null);

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề đề thi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validation các câu hỏi
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = i + 1;

      if (!q.text.trim()) {
        setFormError(`Câu hỏi số ${qNum} chưa nhập nội dung câu hỏi!`);
        return;
      }

      if (q.type === 'mcq') {
        if (!q.options || q.options.length < 2) {
          setFormError(`Câu hỏi số ${qNum} (Trắc nghiệm) phải có ít nhất 2 phương án đáp án!`);
          return;
        }

        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            setFormError(`Phương án ${String.fromCharCode(65 + j)} của Câu hỏi số ${qNum} chưa nhập nội dung!`);
            return;
          }
        }

        if (!q.correct_option_id || !q.options.some((o) => o.id === q.correct_option_id)) {
          setFormError(
            `Câu hỏi số ${qNum} (Trắc nghiệm) CHƯA CHỌN ĐÁP ÁN ĐÚNG! Vui lòng tích chọn một đáp án đúng để hệ thống tự tính điểm khi thí sinh làm bài.`
          );
          return;
        }
      }

      if (Number(q.points) <= 0) {
        setFormError(`Điểm số của Câu hỏi số ${qNum} phải lớn hơn 0!`);
        return;
      }
    }

    try {
      setSaving(true);
      await api.post('/admin/exams', {
        title: title.trim(),
        type,
        department_id: departmentId,
        target_rank_id: type === 'promotion' ? targetRankId : undefined,
        certificate_id: type === 'certificate' ? certificateId : undefined,
        duration_minutes: Number(durationMinutes),
        pass_score: Number(passScore),
        status,
        questions: questions.map((q, i) => ({ ...q, order_index: i + 1 })),
      });
      navigate('/admin/exams');
    } catch (err: any) {
      setFormError(err.message || 'Lỗi lưu đề thi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/exams')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại danh mục đề thi</span>
      </button>

      {/* Top Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] p-6 text-white shadow-lg border border-[#ffd700]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#ffd700] text-[#060d17]">
              Hệ thống Soạn thảo Đề thi Thông minh
            </span>
          </div>
          <h1 className="text-2xl font-black">{t('admin.createExam')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Tích chọn câu đúng cho phần trắc nghiệm để <strong>hệ thống tự động chấm điểm</strong>. Thiết lập câu tự luận để <strong>người chấm điểm tự đưa điểm số ra</strong> sau khi thí sinh nộp bài.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? 'Sửa đề' : t('exam.preview')}</span>
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Lưu nháp</span>
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow-md flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{saving ? 'Đang lưu...' : t('exam.publish')}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {formError && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <strong className="block font-bold mb-1">Vui lòng kiểm tra lại:</strong>
            <p className="leading-relaxed">{formError}</p>
          </div>
        </div>
      )}

      {/* Score Summary Banner */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="p-2 rounded-lg bg-emerald-500 text-white">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)] font-medium block">
              Trắc nghiệm (Tự động chấm):
            </span>
            <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {autoScoreTotal} điểm
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="p-2 rounded-lg bg-blue-500 text-white">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)] font-medium block">
              Tự luận (Người chấm cho điểm):
            </span>
            <strong className="text-sm font-black text-blue-600 dark:text-blue-400">
              {manualScoreTotal} điểm
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
          <div className={`p-2 rounded-lg ${totalPoints === 10 ? 'bg-[#ffd700] text-[#060d17]' : 'bg-amber-500 text-white'}`}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[var(--color-text-secondary)] font-medium block">
              Tổng điểm đề thi:
            </span>
            <strong className="text-sm font-black text-[var(--color-text)]">
              {totalPoints} / 10 điểm {totalPoints !== 10 && <span className="text-amber-500 font-normal text-[11px]">(Chuẩn là 10đ)</span>}
            </strong>
          </div>
        </div>
      </div>

      {/* Preview Mode Screen */}
      {previewMode ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <span className="text-xs font-bold uppercase text-[#ffd700]">Giao diện xem trước</span>
              <h2 className="text-lg font-black text-[var(--color-text)]">{title || 'Chưa nhập tiêu đề đề thi'}</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Thời gian làm bài: {durationMinutes} phút • Điểm chuẩn: {passScore}đ • Tổng: {questions.length} câu ({totalPoints} điểm)
              </p>
            </div>
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700]"
            >
              Quay lại chỉnh sửa
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a6b] text-[#ffd700]">
                    Câu {idx + 1} ({q.points} điểm)
                  </span>
                  <span className="text-xs font-bold uppercase text-[var(--color-text-secondary)]">
                    {q.type === 'mcq' ? '🤖 Trắc nghiệm tự chấm' : q.type === 'essay' ? '✍️ Tự luận người chấm' : '⚖️ Đúng / Sai'}
                  </span>
                </div>
                <p className="text-sm font-bold text-[var(--color-text)]">{q.text || 'Chưa nhập nội dung đề bài...'}</p>

                {q.type === 'mcq' && (
                  <div className="space-y-2 pt-2">
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = q.correct_option_id === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt.text || <em>Chưa nhập nội dung</em>}</span>
                          </div>
                          {isCorrect && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                              <Check className="h-3 w-3" /> Đáp án đúng (Tự động chấm)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'essay' && (
                  <div className="p-3 rounded-xl border border-dashed border-blue-500/40 bg-blue-500/5 text-xs space-y-1.5">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block">
                      Ô làm bài tự luận của thí sinh (Người chấm sẽ cho điểm từ 0 đến {q.points} điểm):
                    </span>
                    <div className="p-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] italic">
                      Thí sinh sẽ nhập văn bản tự luận tại đây (Tối thiểu {q.min_words || 20} từ)...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main Settings Form */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
              <span>Thông tin chung đề thi</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                {t('exam.title')}: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra Nghiệp vụ Cảnh sát Giao thông đường bộ 2026..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm text-[var(--color-text)] font-semibold focus:ring-2 focus:ring-[#ffd700]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                  Sở Cảnh Sát áp dụng:
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value as any)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] font-bold"
                >
                  <option value="all">🌐 Toàn lực lượng (Chung)</option>
                  <option value="sasp">🔵 State Police (SASP)</option>
                  <option value="lspd">🛡️ Los Santos Police (LSPD)</option>
                  <option value="bcso">⭐ Blaine Sheriff (BCSO)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                  {t('exam.type')}:
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ExamType)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)]"
                >
                  <option value="general">{t('exam.general')}</option>
                  <option value="promotion">{t('exam.promotion')}</option>
                  <option value="certificate">{t('exam.certificate')}</option>
                </select>
              </div>

              {type === 'promotion' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                    Cấp bậc mục tiêu:
                  </label>
                  <select
                    value={targetRankId}
                    onChange={(e) => setTargetRankId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)]"
                  >
                    {ranks
                      .filter(
                        (r) =>
                          departmentId === 'all' ||
                          !r.department_id ||
                          r.department_id === 'all' ||
                          r.department_id === departmentId
                      )
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Bậc {r.level})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {type === 'certificate' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                    Chứng chỉ áp dụng:
                  </label>
                  <select
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)]"
                  >
                    {certs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                  Thời gian làm bài (phút):
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                  Điểm chuẩn đạt (Pass score):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={passScore}
                  onChange={(e) => setPassScore(parseFloat(e.target.value) || 5)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)] font-bold text-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Danh sách câu hỏi ({questions.length} câu • Tổng {totalPoints} điểm)
                </h2>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  Trắc nghiệm tự động tính điểm khi tích đúng • Tự luận do Cán bộ chấm tự đưa điểm số ra
                </p>
              </div>

              {/* Add Question Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('mcq')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>+ Trắc nghiệm (Tự chấm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('essay')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>+ Tự luận (Chấm tay)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('true_false_explain')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>+ Đúng/Sai</span>
                </button>
              </div>
            </div>

            {/* List of Questions */}
            {questions.map((q, idx) => {
              const isMcq = q.type === 'mcq';
              const isEssay = q.type === 'essay';
              const isTf = q.type === 'true_false_explain';

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${
                    isMcq
                      ? 'border-emerald-500/30 bg-[var(--color-surface)]'
                      : isEssay
                      ? 'border-blue-500/30 bg-[var(--color-surface)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  {/* Question Top Bar */}
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a6b] text-[#ffd700]">
                        Câu {idx + 1}
                      </span>

                      {/* Type Badge */}
                      {isMcq && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <Cpu className="h-3 w-3" />
                          <span>Trắc nghiệm (Hệ thống tự tính điểm)</span>
                        </span>
                      )}

                      {isEssay && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          <PenTool className="h-3 w-3" />
                          <span>Tự luận (Người chấm tự đưa điểm số ra)</span>
                        </span>
                      )}

                      {isTf && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <span>Đúng / Sai kèm giải thích</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Points input */}
                      <div className="flex items-center gap-1 bg-[var(--color-bg)] px-2 py-1 rounded-lg border border-[var(--color-border)]">
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Điểm:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="10"
                          value={q.points}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1;
                            const copy = [...questions];
                            copy[idx].points = val;
                            setQuestions(copy);
                          }}
                          className="w-14 bg-transparent p-0.5 text-xs text-center font-black text-[var(--color-text)] focus:outline-none"
                        />
                        <span className="text-xs font-bold text-[var(--color-text-secondary)]">đ</span>
                      </div>

                      {/* Move Up/Down */}
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        title="Di chuyển lên"
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, 'down')}
                        disabled={idx === questions.length - 1}
                        title="Di chuyển xuống"
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        title="Xóa câu hỏi này"
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                      Nội dung đề bài câu hỏi: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={q.text}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[idx].text = e.target.value;
                        setQuestions(copy);
                      }}
                      placeholder="Nhập nội dung đề bài câu hỏi tại đây..."
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)] focus:ring-2 focus:ring-[#ffd700]"
                    />
                  </div>

                  {/* MCQ Options with Clear Correct Option Selector */}
                  {isMcq && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-[var(--color-text)]">
                            Các phương án đáp án (Tích chọn nút xanh để đặt làm ĐÁP ÁN ĐÚNG):
                          </label>
                          <p className="text-[11px] text-[var(--color-text-secondary)]">
                            Hệ thống sẽ tự động so khớp: thí sinh tích đúng đáp án này sẽ nhận trọn <strong>{q.points} điểm</strong>.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddOption(idx)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Thêm đáp án</span>
                        </button>
                      </div>

                      {/* Options List */}
                      <div className="space-y-2">
                        {q.options?.map((opt, oIdx) => {
                          const isCorrect = q.correct_option_id === opt.id;
                          const letter = String.fromCharCode(65 + oIdx);

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30'
                                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-slate-400'
                              }`}
                            >
                              {/* Correct Option Radio Button / Badge */}
                              <button
                                type="button"
                                onClick={() => handleSelectCorrectOption(idx, opt.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-emerald-600 hover:border-emerald-500'
                                }`}
                                title={isCorrect ? 'Đây là đáp án đúng' : 'Bấm để chọn phương án này làm đáp án đúng'}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                                    <span>ĐÁP ÁN ĐÚNG</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="h-3.5 w-3.5 rounded-full border border-slate-400" />
                                    <span>Chọn đúng</span>
                                  </>
                                )}
                              </button>

                              <span className="font-black text-xs w-5 text-center text-[var(--color-text)]">
                                {letter}.
                              </span>

                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const copy = [...questions];
                                  if (copy[idx].options) {
                                    copy[idx].options![oIdx].text = e.target.value;
                                  }
                                  setQuestions(copy);
                                }}
                                placeholder={`Nội dung lựa chọn ${letter}...`}
                                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />

                              {/* Remove Option Button */}
                              {q.options && q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(idx, oIdx)}
                                  title="Xóa phương án này"
                                  className="p-1 rounded text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Warning if no correct option selected */}
                      {!q.correct_option_id && (
                        <div className="p-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>⚠️ Câu hỏi này chưa được chọn đáp án đúng! Hãy bấm vào nút "Chọn đúng" ở phương án chính xác.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Essay Question Notice & Word Count */}
                  {isEssay && (
                    <div className="rounded-xl bg-blue-500/10 p-3.5 border border-blue-500/20 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <PenTool className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-[var(--color-text)]">
                          <strong className="block font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                            Quy chế câu hỏi tự luận:
                          </strong>
                          <span>
                            Thí sinh sẽ nhập văn bản tự luận khi thi. Khi nộp bài, điểm câu này tạm tính là 0đ.
                            Cán bộ chấm thi / Hội đồng chấm sẽ trực tiếp đọc bài thi và <strong>tự đưa điểm số ra (từ 0 đến {q.points} điểm)</strong>.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-blue-500/20 text-xs">
                        <span className="font-semibold text-[var(--color-text)]">Yêu cầu độ dài tối thiểu:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={q.min_words || 20}
                            onChange={(e) => {
                              const copy = [...questions];
                              copy[idx].min_words = parseInt(e.target.value) || 0;
                              setQuestions(copy);
                            }}
                            className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-1 text-center font-bold text-xs"
                          />
                          <span className="text-[var(--color-text-secondary)]">từ</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* True / False Explain */}
                  {isTf && (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-[var(--color-text)] block">
                        Đáp án chuẩn đối chiếu phần Đúng / Sai:
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...questions];
                            copy[idx].correct_boolean = true;
                            setQuestions(copy);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                            q.correct_boolean === true
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                              : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          <span>ĐÁP ÁN: ĐÚNG</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...questions];
                            copy[idx].correct_boolean = false;
                            setQuestions(copy);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                            q.correct_boolean === false
                              ? 'bg-red-600 text-white border-red-600 shadow'
                              : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          <span>ĐÁP ÁN: SAI</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Grader Note / Model Answer criteria (Only visible to graders) */}
                  <div>
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                      ⭐ Tiêu chí chấm điểm / Hướng dẫn cho Cán bộ chấm thi (Chỉ Hội đồng chấm và Quản trị thấy):
                    </label>
                    <textarea
                      rows={2}
                      value={q.grader_note || ''}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[idx].grader_note = e.target.value;
                        setQuestions(copy);
                      }}
                      placeholder="Căn cứ điều luật, thang điểm chi tiết cho từng ý trả lời (ví dụ: Ý 1 được 2đ, Ý 2 được 4đ)..."
                      className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-[var(--color-text)] focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
