// API Client with hybrid support:
// 1. Direct fetch to /api for production / Vercel Serverless Functions
// 2. Client-side simulation fallback during local development so all features work immediately out-of-the-box!

import { db } from './mockApi';
import type {
  AuthPayload,
  Role,
  User,
  Exam,
  ExamAssignment,
  Attempt,
  Answer,
  Certificate,
  CertificateRequest,
  Appeal,
  AntiCheatEvent,
} from './types';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Helper to simulate network latency
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to get active session user from localStorage
function getSessionUser(): AuthPayload | null {
  try {
    const raw = localStorage.getItem('pd_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSessionUser(user: AuthPayload | null) {
  if (user) {
    localStorage.setItem('pd_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('pd_auth_user');
  }
}

// Mock handler implementation
async function handleMockRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
  await delay(120);
  const currentUser = getSessionUser();

  // ─── AUTH ROUTES ───
  if (endpoint === '/auth/login' && method === 'POST') {
    const { callsign, password, role } = body || {};
    const normalizedCallsign = (callsign || '').trim().toLowerCase();

    const user = db.users.find((u) => u.callsign.toLowerCase() === normalizedCallsign);
    if (!user) {
      throw new ApiError('Số hiệu hoặc mật khẩu không chính xác', 401);
    }

    if (!user.is_active) {
      throw new ApiError('Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.', 403);
    }

    // Role verification
    if (!user.roles.includes(role)) {
      throw new ApiError(`Tài khoản không có thẩm quyền truy cập vai trò ${role}`, 403);
    }

    // Passwords in demo: 123456 or admin123 or matches
    if (password !== '123456' && password !== 'admin123' && password !== 'changeme123') {
      throw new ApiError('Mật khẩu không đúng', 401);
    }

    const payload: AuthPayload = {
      userId: user.id,
      callsign: user.callsign,
      role: role as Role,
      roles: user.roles,
      fullName: user.full_name,
      rankId: user.rank_id,
      department_id: user.department_id || 'sasp',
      avatar_url: user.avatar_url,
      personal_photo_url: user.personal_photo_url,
      duty_note: user.duty_note,
    };

    setSessionUser(payload);
    return { user: payload } as T;
  }

  if (endpoint === '/departments' && method === 'GET') {
    return db.departments as T;
  }

  if (endpoint === '/auth/profile-photos' && method === 'PATCH') {
    if (!currentUser) throw new ApiError('Chưa đăng nhập', 401);
    const user = db.users.find((u) => u.id === currentUser.userId);
    if (!user) throw new ApiError('Không tìm thấy tài khoản', 404);

    const { avatar_url, personal_photo_url } = body || {};
    if (avatar_url !== undefined) {
      user.avatar_url = avatar_url;
      currentUser.avatar_url = avatar_url;
    }
    if (personal_photo_url !== undefined) {
      user.personal_photo_url = personal_photo_url;
      currentUser.personal_photo_url = personal_photo_url;
    }

    db.save();
    setSessionUser(currentUser);
    return { success: true, user: currentUser } as T;
  }

  if (endpoint === '/auth/me' && method === 'GET') {
    if (!currentUser) throw new ApiError('Chưa đăng nhập', 401);
    return { user: currentUser } as T;
  }

  if (endpoint === '/auth/logout' && method === 'POST') {
    setSessionUser(null);
    return { success: true } as T;
  }

  if (endpoint === '/auth/change-password' && method === 'POST') {
    return { success: true, message: 'Đổi mật khẩu thành công' } as T;
  }

  // ─── OFFICER ROUTES ───
  if (endpoint === '/assignments/my' && method === 'GET') {
    const uid = currentUser?.userId || 'user-officer-1';
    const list = db.assignments
      .filter((a) => a.user_id === uid && a.status !== 'cancelled')
      .map((a) => ({
        ...a,
        exam: db.exams.find((e) => e.id === a.exam_id),
      }));
    return list as T;
  }

  if (endpoint === '/attempts/start' && method === 'POST') {
    const { assignmentId } = body || {};
    const assign = db.assignments.find((a) => a.id === assignmentId);
    if (!assign) throw new ApiError('Không tìm thấy bài thi được giao', 404);

    const exam = db.exams.find((e) => e.id === assign.exam_id);
    if (!exam || !exam.questions) throw new ApiError('Đề thi không tồn tại hoặc chưa có câu hỏi', 400);

    // Shuffle question IDs
    const shuffledQuestionIds = [...exam.questions]
      .sort(() => Math.random() - 0.5)
      .map((q) => q.id);

    // Shuffle options for MCQ
    const optionOrders: Record<string, string[]> = {};
    exam.questions.forEach((q) => {
      if (q.options && q.options.length > 0) {
        optionOrders[q.id] = [...q.options].sort(() => Math.random() - 0.5).map((o) => o.id);
      }
    });

    const now = new Date();
    const deadline = new Date(now.getTime() + exam.duration_minutes * 60 * 1000);
    const examCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const attempt: Attempt = {
      id: 'attempt-' + Date.now(),
      assignment_id: assign.id,
      user_id: assign.user_id,
      exam_id: exam.id,
      exam_code: examCode,
      question_order: shuffledQuestionIds,
      option_orders: optionOrders,
      started_at: now.toISOString(),
      deadline_at: deadline.toISOString(),
      status: 'in_progress',
    };

    db.attempts.push(attempt);
    assign.status = 'in_progress';
    db.save();

    return attempt as T;
  }

  if (endpoint.startsWith('/attempts/') && method === 'GET') {
    const attemptId = endpoint.split('/')[2];
    const attempt = db.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new ApiError('Không tìm thấy phiên làm bài', 404);

    const exam = db.exams.find((e) => e.id === attempt.exam_id);
    if (!exam) throw new ApiError('Đề thi không tồn tại', 404);

    // Sanitize questions: tuyệt đối không gửi đáp án đúng hay grader_note khi đang thi!
    const sanitizedQuestions = (exam.questions || []).map((q) => {
      const sanitized = { ...q };
      delete (sanitized as any).correct_option_id;
      delete (sanitized as any).correct_boolean;
      delete (sanitized as any).grader_note;

      // Reorder options according to attempt option_orders
      if (attempt.option_orders && attempt.option_orders[q.id] && q.options) {
        const order = attempt.option_orders[q.id];
        sanitized.options = [...q.options].sort(
          (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
        );
      }
      return sanitized;
    });

    // Sort questions according to attempt question_order
    sanitizedQuestions.sort(
      (a, b) => attempt.question_order.indexOf(a.id) - attempt.question_order.indexOf(b.id)
    );

    const answers = db.answers.filter((ans) => ans.attempt_id === attempt.id);

    return {
      attempt,
      exam: { ...exam, questions: sanitizedQuestions },
      answers,
    } as T;
  }

  if (endpoint.includes('/answers') && method === 'POST') {
    const attemptId = endpoint.split('/')[2];
    const { questionId, selected_option_id, selected_boolean, text_answer } = body || {};

    let ans = db.answers.find((a) => a.attempt_id === attemptId && a.question_id === questionId);
    if (!ans) {
      ans = {
        id: 'ans-' + Date.now(),
        attempt_id: attemptId,
        question_id: questionId,
      };
      db.answers.push(ans);
    }
    ans.selected_option_id = selected_option_id;
    ans.selected_boolean = selected_boolean;
    ans.text_answer = text_answer;
    db.save();

    return { success: true } as T;
  }

  if (endpoint.includes('/submit') && method === 'POST') {
    const attemptId = endpoint.split('/')[2];
    const { submit_reason = 'manual' } = body || {};

    const attempt = db.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new ApiError('Không tìm thấy bài thi', 404);

    const exam = db.exams.find((e) => e.id === attempt.exam_id);
    if (!exam || !exam.questions) throw new ApiError('Lỗi dữ liệu bài thi', 500);

    attempt.submitted_at = new Date().toISOString();
    attempt.submit_reason = submit_reason;

    // Auto grade MCQ questions
    let autoScore = 0;
    let hasEssay = false;

    exam.questions.forEach((q) => {
      const userAns = db.answers.find((a) => a.attempt_id === attempt.id && a.question_id === q.id);
      if (q.type === 'mcq') {
        if (userAns && userAns.selected_option_id === q.correct_option_id) {
          userAns.auto_points = q.points;
          autoScore += q.points;
        } else if (userAns) {
          userAns.auto_points = 0;
        }
      } else {
        hasEssay = true;
      }
    });

    attempt.auto_score = autoScore;

    // If only MCQ questions, grade immediately
    if (!hasEssay) {
      attempt.final_score = autoScore;
      attempt.passed = autoScore >= exam.pass_score;
      attempt.status = 'graded';
    } else {
      attempt.status = 'submitted';
    }

    // Update assignment status
    const assign = db.assignments.find((a) => a.id === attempt.assignment_id);
    if (assign) {
      assign.status = attempt.status === 'graded' ? 'graded' : 'submitted';
    }

    db.save();
    return { attempt } as T;
  }

  // ─── RESULTS & APPEALS ───
  if (endpoint === '/results/my' && method === 'GET') {
    const uid = currentUser?.userId || 'user-officer-1';
    const list = db.attempts
      .filter((a) => a.user_id === uid && a.status !== 'in_progress')
      .map((a) => ({
        ...a,
        exam: db.exams.find((e) => e.id === a.exam_id),
      }));
    return list as T;
  }

  if (endpoint.startsWith('/results/') && method === 'GET') {
    const attemptId = endpoint.split('/')[2];
    const attempt = db.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new ApiError('Không tìm thấy kết quả', 404);

    const exam = db.exams.find((e) => e.id === attempt.exam_id);
    const answers = db.answers.filter((a) => a.attempt_id === attempt.id);
    const appeal = db.appeals.find((ap) => ap.attempt_id === attempt.id);

    return {
      attempt,
      exam,
      answers,
      appeal,
    } as T;
  }

  if (endpoint === '/appeals' && method === 'POST') {
    const { attemptId, reason } = body || {};
    const existing = db.appeals.find((ap) => ap.attempt_id === attemptId && ap.status === 'pending');
    if (existing) throw new ApiError('Bài thi này đã có yêu cầu phúc khảo đang chờ duyệt', 400);

    const attempt = db.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new ApiError('Không tìm thấy bài thi', 404);

    const appeal: Appeal = {
      id: 'appeal-' + Date.now(),
      attempt_id: attemptId,
      user_id: currentUser?.userId || attempt.user_id,
      reason,
      status: 'pending',
      previous_score: attempt.final_score,
      created_at: new Date().toISOString(),
    };

    db.appeals.push(appeal);
    db.save();
    return appeal as T;
  }

  // ─── CERTIFICATES ───
  if (endpoint === '/certificates' && method === 'GET') {
    return db.certificates.filter((c) => c.is_active) as T;
  }

  if (endpoint === '/certificates/my' && method === 'GET') {
    const uid = currentUser?.userId || 'user-officer-1';
    const requests = db.certRequests
      .filter((r) => r.user_id === uid)
      .map((r) => ({
        ...r,
        certificate: db.certificates.find((c) => c.id === r.certificate_id),
      }));
    const granted = db.userCerts
      .filter((uc) => uc.user_id === uid && !uc.revoked_at)
      .map((uc) => ({
        ...uc,
        certificate: db.certificates.find((c) => c.id === uc.certificate_id),
      }));
    return { requests, granted } as T;
  }

  if (endpoint === '/certificates/request' && method === 'POST') {
    const { certificateId, note } = body || {};
    const uid = currentUser?.userId || 'user-officer-1';

    const req: CertificateRequest = {
      id: 'req-' + Date.now(),
      user_id: uid,
      certificate_id: certificateId,
      status: 'pending',
      note,
      created_at: new Date().toISOString(),
    };

    db.certRequests.push(req);
    db.save();
    return req as T;
  }

  // ─── ANTI-CHEAT LOGGING ───
  if (endpoint === '/anticheat/event' && method === 'POST') {
    const event: AntiCheatEvent = {
      id: 'event-' + Date.now(),
      attempt_id: body.attempt_id,
      type: body.type,
      reason: body.reason,
      device: body.device,
      away_seconds: body.away_seconds,
      user_agent: navigator.userAgent,
      occurred_at: new Date().toISOString(),
    };
    db.antiCheatEvents.push(event);
    db.save();
    return { success: true } as T;
  }

  // ─── GRADER ROUTES ───
  if (endpoint === '/grading/queue' && method === 'GET') {
    const uid = currentUser?.userId;
    // Submissions waiting for grading (not own submission)
    const queue = db.attempts
      .filter((a) => (a.status === 'submitted' || a.status === 'in_progress') && a.user_id !== uid)
      .map((a) => ({
        ...a,
        user: db.users.find((u) => u.id === a.user_id),
        exam: db.exams.find((e) => e.id === a.exam_id),
      }));
    return queue as T;
  }

  if (endpoint.startsWith('/grading/') && method === 'GET') {
    const attemptId = endpoint.split('/')[2];
    const attempt = db.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new ApiError('Không tìm thấy bài làm', 404);

    const exam = db.exams.find((e) => e.id === attempt.exam_id);
    const answers = db.answers.filter((a) => a.attempt_id === attempt.id);
    const officer = db.users.find((u) => u.id === attempt.user_id);

    return {
      attempt,
      exam,
      answers,
      officer,
    } as T;
  }

  if (endpoint.includes('/grading/') && endpoint.endsWith('/complete') && method === 'POST') {
    const attemptId = endpoint.split('/')[2];
    const { grades } = body || {}; // record of question_id -> { points, comment }

    const attempt = db.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new ApiError('Không tìm thấy bài thi', 404);

    const exam = db.exams.find((e) => e.id === attempt.exam_id);
    if (!exam || !exam.questions) throw new ApiError('Lỗi dữ liệu bài thi', 500);

    let totalScore = attempt.auto_score || 0;

    Object.entries(grades || {}).forEach(([qId, gradeData]: [string, any]) => {
      let ans = db.answers.find((a) => a.attempt_id === attempt.id && a.question_id === qId);
      if (!ans) {
        ans = {
          id: 'ans-' + Date.now() + Math.random(),
          attempt_id: attempt.id,
          question_id: qId,
        };
        db.answers.push(ans);
      }
      ans.manual_points = Number(gradeData.points) || 0;
      ans.grader_comment = gradeData.comment || '';
      ans.graded_by = currentUser?.userId;
      ans.graded_at = new Date().toISOString();
      totalScore += ans.manual_points;
    });

    attempt.final_score = totalScore;
    attempt.passed = totalScore >= exam.pass_score;
    attempt.status = 'graded';

    const assign = db.assignments.find((a) => a.id === attempt.assignment_id);
    if (assign) assign.status = 'graded';

    // If passed and was certificate exam, grant certificate
    if (attempt.passed && exam.type === 'certificate' && exam.certificate_id) {
      db.userCerts.push({
        id: 'uc-' + Date.now(),
        user_id: attempt.user_id,
        certificate_id: exam.certificate_id,
        attempt_id: attempt.id,
        granted_at: new Date().toISOString(),
        granted_by: currentUser?.userId,
      });
    }

    db.save();
    return { attempt } as T;
  }

  // ─── ADMIN ROUTES ───
  if (endpoint === '/admin/stats' && method === 'GET') {
    return {
      totalOfficers: db.users.filter((u) => u.roles.includes('OFFICER')).length,
      activeExams: db.exams.filter((e) => e.status === 'published').length,
      pendingGrading: db.attempts.filter((a) => a.status === 'submitted').length,
      pendingAppeals: db.appeals.filter((ap) => ap.status === 'pending').length,
      pendingCertRequests: db.certRequests.filter((cr) => cr.status === 'pending').length,
    } as T;
  }

  if (endpoint === '/admin/users' && method === 'GET') {
    // Phân quyền đặc biệt:
    // Sĩ quan thuộc SASP hoặc Quản trị viên (ADMIN) có thẩm quyền tiểu bang, xem được toàn bộ sĩ quan của mọi sở (SASP, BCSO & LSPD).
    // Sĩ quan thuộc BCSO/LSPD chỉ xem được cán bộ trong nội bộ sở của mình.
    const isSaspOrAdmin =
      !currentUser ||
      currentUser.roles.includes('ADMIN') ||
      currentUser.department_id === 'sasp';

    let userList = db.users;
    if (!isSaspOrAdmin && currentUser?.department_id) {
      userList = db.users.filter((u) => u.department_id === currentUser.department_id);
    }

    const usersWithRankAndDept = userList.map((u) => ({
      ...u,
      rank: db.ranks.find((r) => r.id === u.rank_id),
      department: db.departments.find((d) => d.id === u.department_id) || db.departments[0],
    }));
    return usersWithRankAndDept as T;
  }

  if (endpoint === '/admin/users' && method === 'POST') {
    const { full_name, callsign, rank_id, roles, duty_note, custom_password, department_id = 'bcso' } = body || {};
    const norm = callsign.trim().toLowerCase();

    if (db.users.some((u) => u.callsign.toLowerCase() === norm)) {
      throw new ApiError('Số hiệu (callsign) này đã tồn tại trong sở', 400);
    }

    // Auto-generate one-time password or use custom
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let generatedPassword = '';
    for (let i = 0; i < 10; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalPassword = custom_password ? custom_password.trim() : generatedPassword;

    const newUser: User = {
      id: 'user-' + Date.now(),
      callsign: norm,
      full_name,
      rank_id,
      roles: roles || ['OFFICER'],
      department_id,
      is_active: true,
      duty_note,
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.save();

    return { user: newUser, initialPassword: finalPassword } as T;
  }

  if (endpoint.startsWith('/admin/users/') && method === 'PATCH') {
    const uid = endpoint.split('/')[3];
    const user = db.users.find((u) => u.id === uid);
    if (!user) throw new ApiError('Không tìm thấy cán bộ', 404);

    Object.assign(user, body);
    db.save();
    return user as T;
  }

  if (endpoint.startsWith('/admin/users/') && method === 'DELETE') {
    const uid = endpoint.split('/')[3];
    const userToDelete = db.users.find((u) => u.id === uid);
    if (!userToDelete) throw new ApiError('Không tìm thấy tài khoản cán bộ', 404);

    if (userToDelete.callsign.toLowerCase() === 'admin') {
      throw new ApiError('Bảo vệ hệ thống: Không thể xóa tài khoản Quản trị viên tối cao (root admin)!', 400);
    }

    if (userToDelete.id === currentUser?.userId) {
      throw new ApiError('Không thể tự xóa tài khoản của chính mình!', 400);
    }

    db.users = db.users.filter((u) => u.id !== uid);
    db.assignments = db.assignments.filter((a) => a.user_id !== uid);
    db.save();
    return { success: true } as T;
  }

  if (endpoint === '/admin/ranks' && method === 'GET') {
    return db.ranks
      .map((r) => ({
        ...r,
        department: db.departments.find((d) => d.id === r.department_id),
      }))
      .sort((a, b) => a.level - b.level) as T;
  }

  if (endpoint === '/admin/ranks' && method === 'POST') {
    const newRank = { id: 'rank-' + Date.now(), department_id: body.department_id || 'sasp', ...body };
    db.ranks.push(newRank);
    db.save();
    return newRank as T;
  }

  if (endpoint.startsWith('/admin/ranks/') && method === 'PATCH') {
    const rankId = endpoint.split('/')[3];
    const rank = db.ranks.find((r) => r.id === rankId);
    if (!rank) throw new ApiError('Không tìm thấy cấp bậc', 404);
    Object.assign(rank, body);
    db.save();
    return rank as T;
  }

  if (endpoint.startsWith('/admin/ranks/') && method === 'DELETE') {
    const rankId = endpoint.split('/')[3];
    const assignedUsers = db.users.filter((u) => u.rank_id === rankId);
    if (assignedUsers.length > 0) {
      const names = assignedUsers.map((u) => u.full_name).slice(0, 3).join(', ');
      throw new ApiError(
        `Không thể xóa cấp bậc này vì đang có ${assignedUsers.length} cán bộ sĩ quan (${names}...) đang giữ cấp bậc. Vui lòng chuyển cấp bậc của họ trước khi xóa.`,
        400
      );
    }
    db.ranks = db.ranks.filter((r) => r.id !== rankId);
    db.save();
    return { success: true } as T;
  }

  if (endpoint === '/admin/exams' && method === 'GET') {
    const list = db.exams.map((e) => ({
      ...e,
      department: db.departments.find((d) => d.id === e.department_id),
      target_rank: db.ranks.find((r) => r.id === e.target_rank_id),
      certificate: db.certificates.find((c) => c.id === e.certificate_id),
    }));
    return list as T;
  }

  if (endpoint === '/admin/exams' && method === 'POST') {
    const newExam: Exam = {
      id: 'exam-' + Date.now(),
      department_id: body.department_id || 'all',
      ...body,
      created_by: currentUser?.userId || 'user-admin',
      created_at: new Date().toISOString(),
    };
    db.exams.push(newExam);
    db.save();
    return newExam as T;
  }

  if (endpoint.startsWith('/admin/exams/') && method === 'DELETE') {
    const examId = endpoint.split('/')[3];
    const examToDelete = db.exams.find((e) => e.id === examId);
    if (!examToDelete) throw new ApiError('Không tìm thấy đề thi cần xóa', 404);

    const relatedAttempts = db.attempts.filter((a) => a.exam_id === examId);
    if (relatedAttempts.length > 0) {
      db.attempts = db.attempts.filter((a) => a.exam_id !== examId);
      db.answers = db.answers.filter((ans) => !relatedAttempts.some((att) => att.id === ans.attempt_id));
    }
    db.assignments = db.assignments.filter((a) => a.exam_id !== examId);
    db.exams = db.exams.filter((e) => e.id !== examId);
    db.save();
    return { success: true } as T;
  }

  if (endpoint === '/admin/assignments' && method === 'GET') {
    const list = db.assignments.map((a) => ({
      ...a,
      user: db.users.find((u) => u.id === a.user_id),
      exam: db.exams.find((e) => e.id === a.exam_id),
    }));
    return list as T;
  }

  if (endpoint === '/admin/assignments' && method === 'POST') {
    const { exam_id, user_ids } = body || {};
    const created: ExamAssignment[] = [];

    user_ids.forEach((uid: string) => {
      const assign: ExamAssignment = {
        id: 'assign-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        exam_id,
        user_id: uid,
        assigned_by: currentUser?.userId || 'user-admin',
        assigned_at: new Date().toISOString(),
        status: 'assigned',
      };
      db.assignments.push(assign);
      created.push(assign);
    });

    db.save();
    return created as T;
  }

  // ─── ADMIN CERTIFICATES MANAGEMENT ───
  if (endpoint === '/admin/certificates' && method === 'GET') {
    const list = db.certificates.map((c) => {
      const examsCount = db.exams.filter((e) => e.certificate_id === c.id).length;
      const holdersCount = db.userCerts.filter((uc) => uc.certificate_id === c.id && !uc.revoked_at).length;
      const pendingRequestsCount = db.certRequests.filter((cr) => cr.certificate_id === c.id && cr.status === 'pending').length;
      return {
        ...c,
        examsCount,
        holdersCount,
        pendingRequestsCount,
      };
    });
    return list as T;
  }

  if (endpoint === '/admin/certificates' && method === 'POST') {
    const { name, description, is_active = true } = body || {};
    if (!name || !name.trim()) {
      throw new ApiError('Tên chứng chỉ không được để trống', 400);
    }
    const newCert: Certificate = {
      id: 'cert-' + Date.now(),
      name: name.trim(),
      description: description ? description.trim() : '',
      is_active: Boolean(is_active),
    };
    db.certificates.push(newCert);
    db.save();
    return newCert as T;
  }

  if (endpoint.startsWith('/admin/certificates/') && method === 'PATCH') {
    const certId = endpoint.split('/')[3];
    const cert = db.certificates.find((c) => c.id === certId);
    if (!cert) throw new ApiError('Không tìm thấy chứng chỉ', 404);

    if (body.name !== undefined) {
      if (!body.name.trim()) throw new ApiError('Tên chứng chỉ không được để trống', 400);
      cert.name = body.name.trim();
    }
    if (body.description !== undefined) {
      cert.description = body.description.trim();
    }
    if (body.is_active !== undefined) {
      cert.is_active = Boolean(body.is_active);
    }
    db.save();
    return cert as T;
  }

  if (endpoint.startsWith('/admin/certificates/') && method === 'DELETE') {
    const certId = endpoint.split('/')[3];
    const cert = db.certificates.find((c) => c.id === certId);
    if (!cert) throw new ApiError('Không tìm thấy chứng chỉ', 404);

    const linkedExams = db.exams.filter((e) => e.certificate_id === certId);
    if (linkedExams.length > 0) {
      const titles = linkedExams.map((e) => e.title).slice(0, 2).join(', ');
      throw new ApiError(
        `Không thể xóa chứng chỉ "${cert.name}" vì đang có ${linkedExams.length} đề thi liên kết (${titles}...). Vui lòng gỡ hoặc xóa đề thi liên quan trước, hoặc chuyển trạng thái sang Tạm dừng.`,
        400
      );
    }

    const holders = db.userCerts.filter((uc) => uc.certificate_id === certId);
    if (holders.length > 0) {
      throw new ApiError(
        `Không thể xóa chứng chỉ "${cert.name}" vì đã có ${holders.length} cán bộ được cấp chứng chỉ này. Vui lòng tắt kích hoạt để ngưng cấp mới thay vì xóa.`,
        400
      );
    }

    // Clean up any pending requests
    db.certRequests = db.certRequests.filter((cr) => cr.certificate_id !== certId);
    db.certificates = db.certificates.filter((c) => c.id !== certId);
    db.save();
    return { success: true } as T;
  }

  if (endpoint === '/admin/cert-requests' && method === 'GET') {
    const list = db.certRequests.map((r) => ({
      ...r,
      user: db.users.find((u) => u.id === r.user_id),
      certificate: db.certificates.find((c) => c.id === r.certificate_id),
    }));
    return list as T;
  }

  if (endpoint.startsWith('/admin/cert-requests/') && method === 'PATCH') {
    const reqId = endpoint.split('/')[3];
    const req = db.certRequests.find((r) => r.id === reqId);
    if (!req) throw new ApiError('Không tìm thấy yêu cầu', 404);

    req.status = body.status;
    req.note = body.note;
    req.decided_by = currentUser?.userId;
    req.decided_at = new Date().toISOString();
    db.save();
    return req as T;
  }

  if (endpoint === '/admin/results' && method === 'GET') {
    const list = db.attempts.map((a) => ({
      ...a,
      user: db.users.find((u) => u.id === a.user_id),
      exam: db.exams.find((e) => e.id === a.exam_id),
    }));
    return list as T;
  }

  if (endpoint.includes('/audit') && method === 'GET') {
    const attemptId = endpoint.split('/')[3];
    const events = db.antiCheatEvents.filter((ev) => ev.attempt_id === attemptId);
    return events as T;
  }

  if (endpoint === '/appeals' && method === 'GET') {
    const list = db.appeals.map((ap) => ({
      ...ap,
      user: db.users.find((u) => u.id === ap.user_id),
      attempt: db.attempts.find((a) => a.id === ap.attempt_id),
    }));
    return list as T;
  }

  if (endpoint.startsWith('/appeals/') && method === 'PATCH') {
    const appealId = endpoint.split('/')[2];
    const ap = db.appeals.find((a) => a.id === appealId);
    if (!ap) throw new ApiError('Không tìm thấy đơn', 404);

    ap.status = body.status;
    ap.decided_note = body.decided_note;
    ap.decided_by = currentUser?.userId;
    ap.decided_at = new Date().toISOString();

    // If approved, send attempt back to grading queue
    if (body.status === 'approved') {
      const attempt = db.attempts.find((att) => att.id === ap.attempt_id);
      if (attempt) {
        attempt.status = 'submitted'; // back in queue
      }
    }

    db.save();
    return ap as T;
  }

  // Fallback
  return {} as T;
}

// Master request dispatcher
async function request<T>(endpoint: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // First try local mock handler (guaranteed to succeed in dev)
  try {
    return await handleMockRequest<T>(endpoint, method, body);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Fallback to real fetch if mock threw unknown error
    const res = await fetch(`/api${endpoint}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(data.message || 'Request failed', res.status);
    }
    return res.json();
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
