export type Role = 'OFFICER' | 'GRADER' | 'ADMIN';
export type DepartmentId = 'bcso' | 'sasp' | 'lspd';

export interface Department {
  id: DepartmentId;
  code: string;
  name: string;
  short_name: string;
  logo: string;
  description: string;
  badge_color: string;
}

export type ExamType = 'promotion' | 'certificate' | 'general';
export type ExamStatus = 'draft' | 'published';
export type QuestionType = 'mcq' | 'essay' | 'true_false_explain';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'graded' | 'cancelled';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';
export type SubmitReason = 'manual' | 'timeout' | 'cheating_auto_submit';
export type AppealStatus = 'pending' | 'approved' | 'rejected' | 'regraded';
export type CertRequestStatus = 'pending' | 'approved' | 'rejected';
export type AntiCheatEventType = 'leave' | 'return' | 'warning' | 'auto_submit';
export type AntiCheatReason = 'tab_hidden' | 'window_blur' | 'page_leave';
export type DeviceType = 'desktop' | 'mobile';

export interface Rank {
  id: string;
  name: string;
  level: number;
  can_grade: boolean;
  department_id?: DepartmentId | 'all';
}

export interface User {
  id: string;
  callsign: string;
  full_name: string;
  rank_id: string;
  rank?: Rank;
  roles: Role[];
  department_id?: DepartmentId;
  department?: Department;
  is_active: boolean;
  duty_note?: string;
  avatar_url?: string;
  personal_photo_url?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  examsCount?: number;
  holdersCount?: number;
  pendingRequestsCount?: number;
}

export interface Exam {
  id: string;
  title: string;
  type: ExamType;
  department_id?: DepartmentId | 'all';
  department?: Department;
  target_rank_id?: string;
  certificate_id?: string;
  duration_minutes: number;
  pass_score: number;
  status: ExamStatus;
  created_by: string;
  created_at: string;
  questions?: Question[];
  target_rank?: Rank;
  certificate?: Certificate;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  exam_id: string;
  order_index: number;
  type: QuestionType;
  text: string;
  points: number;
  options?: QuestionOption[];
  correct_option_id?: string;
  correct_boolean?: boolean;
  grader_note?: string;
  min_words: number;
}

export interface CertificateRequest {
  id: string;
  user_id: string;
  certificate_id: string;
  status: CertRequestStatus;
  note?: string;
  decided_by?: string;
  decided_at?: string;
  created_at: string;
  user?: User;
  certificate?: Certificate;
}

export interface UserCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  attempt_id?: string;
  granted_at: string;
  granted_by?: string;
  revoked_at?: string;
  certificate?: Certificate;
}

export interface ExamAssignment {
  id: string;
  exam_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  status: AssignmentStatus;
  exam?: Exam;
  user?: User;
}

export interface Attempt {
  id: string;
  assignment_id: string;
  user_id: string;
  exam_id: string;
  exam_code: string;
  question_order: string[];
  option_orders?: Record<string, string[]>;
  started_at: string;
  deadline_at: string;
  submitted_at?: string;
  submit_reason?: SubmitReason;
  status: AttemptStatus;
  auto_score?: number;
  final_score?: number;
  passed?: boolean;
  exam?: Exam;
  user?: User;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  selected_boolean?: boolean;
  text_answer?: string;
  auto_points?: number;
  manual_points?: number;
  grader_comment?: string;
  graded_by?: string;
  graded_at?: string;
  question?: Question;
}

export interface AntiCheatEvent {
  id: string;
  attempt_id: string;
  type: AntiCheatEventType;
  reason?: AntiCheatReason;
  device?: DeviceType;
  away_seconds?: number;
  user_agent?: string;
  occurred_at: string;
}

export interface Appeal {
  id: string;
  attempt_id: string;
  user_id: string;
  reason: string;
  status: AppealStatus;
  decided_by?: string;
  decided_note?: string;
  previous_score?: number;
  created_at: string;
  decided_at?: string;
  attempt?: Attempt;
  user?: User;
}

export interface AuthPayload {
  userId: string;
  callsign: string;
  role: Role;
  roles: Role[];
  fullName: string;
  rankId: string;
  department_id?: DepartmentId;
  avatar_url?: string;
  personal_photo_url?: string;
  duty_note?: string;
}

export interface LoginRequest {
  callsign: string;
  password: string;
  role: Role;
}
