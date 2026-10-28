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
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Exam, Question, Rank, Certificate, ExamType, QuestionType } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ExamCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Basic Info
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState<'all' | 'sasp' | 'bcso'>('all');
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
      text: 'Câu hỏi mẫu: Trình bày quy trình kiểm tra phương tiện cơ giới đường bộ?',
      points: 4,
      options: [
        { id: 'opt-1', text: 'Chào điều lệnh, thông báo lý do dừng xe, kiểm tra giấy tờ' },
        { id: 'opt-2', text: 'Yêu cầu người vi phạm nộp phạt ngay tại chỗ không cần biên lai' },
        { id: 'opt-3', text: 'Tạm giữ phương tiện ngay lập tức' },
      ],
      correct_option_id: 'opt-1',
      grader_note: 'Căn cứ Thông tư 32/2023/TT-BCA.',
      min_words: 0,
    },
    {
      id: 'q-new-2',
      exam_id: '',
      order_index: 2,
      type: 'essay',
      text: 'Đồng chí hãy nêu các biện pháp nghiệp vụ phòng chống tội phạm công nghệ cao trong giai đoạn hiện nay.',
      points: 6,
      grader_note: 'Đánh giá: 1. Nắm bắt phương thức thủ đoạn (3đ); 2. Phối hợp các ngân hàng và nhà mạng phong tỏa tài khoản (3đ). Tối thiểu 20 từ.',
      min_words: 20,
    },
  ]);

  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const newQ: Question = {
      id: 'q-' + Date.now(),
      exam_id: '',
      order_index: questions.length + 1,
      type: qType,
      text: '',
      points: 2,
      options:
        qType === 'mcq'
          ? [
              { id: 'opt-a', text: '' },
              { id: 'opt-b', text: '' },
              { id: 'opt-c', text: '' },
              { id: 'opt-d', text: '' },
            ]
          : undefined,
      correct_option_id: qType === 'mcq' ? 'opt-a' : undefined,
      correct_boolean: qType === 'true_false_explain' ? true : undefined,
      grader_note: '',
      min_words: 20,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
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

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi');
      return;
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
      alert(err.message || 'Lỗi lưu đề thi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
          <h1 className="text-2xl font-black">{t('admin.createExam')}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Soạn thảo nội dung câu hỏi trực tiếp, phân điểm và thiết lập đáp án tiêu chí chấm điểm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5"
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? 'Chế độ chỉnh sửa' : t('exam.preview')}</span>
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>Lưu nháp</span>
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ffd700] text-[#060d17] hover:bg-amber-400 shadow flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span>{t('exam.publish')}</span>
          </button>
        </div>
      </div>

      {/* Total Score Warning Banner */}
      {totalPoints !== 10 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span>
            {t('exam.scoreWarning', { current: totalPoints, target: 10 })}. Mặc định tổng điểm đề thi chuẩn là 10 điểm.
          </span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
          Thông tin chung đề thi
        </h2>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
            {t('exam.title')}:
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
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 text-xs text-[var(--color-text)]"
            />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
            Danh sách câu hỏi ({questions.length} câu • Tổng {totalPoints} điểm)
          </h2>

          {/* Add Question Dropdown Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAddQuestion('mcq')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow"
            >
              + Trắc nghiệm
            </button>
            <button
              onClick={() => handleAddQuestion('essay')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow"
            >
              + Tự luận
            </button>
            <button
              onClick={() => handleAddQuestion('true_false_explain')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] shadow"
            >
              + Đúng/Sai
            </button>
          </div>
        </div>

        {/* List of Questions */}
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm space-y-4"
          >
            {/* Question Top Bar */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1a3a6b] text-[#ffd700]">
                  Câu {idx + 1}
                </span>
                <span className="text-xs font-bold uppercase text-[var(--color-text-secondary)]">
                  {q.type}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Points input */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--color-text-secondary)]">Điểm:</span>
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
                    className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-1 text-xs text-center font-bold"
                  />
                </div>

                {/* Move Up/Down */}
                <button
                  onClick={() => moveQuestion(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveQuestion(idx, 'down')}
                  disabled={idx === questions.length - 1}
                  className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="p-1 rounded text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                Nội dung câu hỏi:
              </label>
              <textarea
                rows={2}
                value={q.text}
                onChange={(e) => {
                  const copy = [...questions];
                  copy[idx].text = e.target.value;
                  setQuestions(copy);
                }}
                placeholder="Nhập nội dung đề bài..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text)] focus:ring-2 focus:ring-[#ffd700]"
              />
            </div>

            {/* MCQ Options */}
            {q.type === 'mcq' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-text)]">
                  Các lựa chọn đáp án (chọn nút tròn để đánh dấu đáp án đúng):
                </label>
                {q.options?.map((opt, oIdx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correct_option_id === opt.id}
                      onChange={() => {
                        const copy = [...questions];
                        copy[idx].correct_option_id = opt.id;
                        setQuestions(copy);
                      }}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <span className="font-bold text-xs w-4">
                      {String.fromCharCode(65 + oIdx)}.
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
                      placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + oIdx)}...`}
                      className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* True / False Explain */}
            {q.type === 'true_false_explain' && (
              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-[var(--color-text)]">
                  Đáp án đối chiếu chuẩn:
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${q.id}`}
                      checked={q.correct_boolean === true}
                      onChange={() => {
                        const copy = [...questions];
                        copy[idx].correct_boolean = true;
                        setQuestions(copy);
                      }}
                    />
                    <span>ĐÚNG</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${q.id}`}
                      checked={q.correct_boolean === false}
                      onChange={() => {
                        const copy = [...questions];
                        copy[idx].correct_boolean = false;
                        setQuestions(copy);
                      }}
                    />
                    <span>SAI</span>
                  </label>
                </div>
              </div>
            )}

            {/* Grader Note / Answer Key */}
            <div>
              <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                ⭐ Ghi chú cán bộ chấm / Tiêu chuẩn chấm (Chỉ Hội đồng chấm và Quản trị thấy):
              </label>
              <textarea
                rows={2}
                value={q.grader_note || ''}
                onChange={(e) => {
                  const copy = [...questions];
                  copy[idx].grader_note = e.target.value;
                  setQuestions(copy);
                }}
                placeholder="Căn cứ điều luật, đáp án mẫu chi tiết hoặc thang điểm thành phần..."
                className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-[var(--color-text)]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

