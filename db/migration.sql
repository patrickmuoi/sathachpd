-- ============================================================
-- Police Exam Portal — Database Migration (PostgreSQL / Supabase)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- Ranks
-- -----------------------------------------------------------
CREATE TABLE ranks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  can_grade BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Users
-- -----------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  callsign VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rank_id UUID REFERENCES ranks(id),
  roles TEXT[] NOT NULL DEFAULT '{OFFICER}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  duty_note TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Certificates
-- -----------------------------------------------------------
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Exams
-- -----------------------------------------------------------
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('promotion', 'certificate', 'general')),
  target_rank_id UUID REFERENCES ranks(id),
  certificate_id UUID REFERENCES certificates(id),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  pass_score NUMERIC(5,2) NOT NULL DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Questions
-- -----------------------------------------------------------
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('mcq', 'essay', 'true_false_explain')),
  text TEXT NOT NULL,
  points NUMERIC(5,2) NOT NULL DEFAULT 1,
  options JSONB,               -- [{id, text}] for mcq
  correct_option_id VARCHAR(50), -- for mcq
  correct_boolean BOOLEAN,     -- for true_false_explain
  grader_note TEXT,
  min_words INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Certificate requests
-- -----------------------------------------------------------
CREATE TABLE certificate_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  certificate_id UUID NOT NULL REFERENCES certificates(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note TEXT,
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- User certificates (granted)
-- -----------------------------------------------------------
CREATE TABLE user_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  certificate_id UUID NOT NULL REFERENCES certificates(id),
  attempt_id UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ
);

-- -----------------------------------------------------------
-- Exam assignments
-- -----------------------------------------------------------
CREATE TABLE exam_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id),
  user_id UUID NOT NULL REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'graded', 'cancelled'))
);

-- -----------------------------------------------------------
-- Attempts
-- -----------------------------------------------------------
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES exam_assignments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  exam_code VARCHAR(6) NOT NULL,
  question_order JSONB NOT NULL,
  option_orders JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  submit_reason VARCHAR(30) CHECK (submit_reason IN ('manual', 'timeout', 'cheating_auto_submit')),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  auto_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  passed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Answers
-- -----------------------------------------------------------
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_option_id VARCHAR(50),
  selected_boolean BOOLEAN,
  text_answer TEXT,
  auto_points NUMERIC(5,2),
  manual_points NUMERIC(5,2),
  grader_comment TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Anti-cheat events
-- -----------------------------------------------------------
CREATE TABLE anti_cheat_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('leave', 'return', 'warning', 'auto_submit')),
  reason VARCHAR(30) CHECK (reason IN ('tab_hidden', 'window_blur', 'page_leave')),
  device VARCHAR(20) CHECK (device IN ('desktop', 'mobile')),
  away_seconds NUMERIC(10,2),
  user_agent TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Appeals
-- -----------------------------------------------------------
CREATE TABLE appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES attempts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'regraded')),
  decided_by UUID REFERENCES users(id),
  decided_note TEXT,
  previous_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_users_callsign ON users(callsign);
CREATE INDEX idx_users_rank ON users(rank_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_type ON exams(type);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_assignments_user ON exam_assignments(user_id);
CREATE INDEX idx_assignments_exam ON exam_assignments(exam_id);
CREATE INDEX idx_assignments_status ON exam_assignments(status);
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_assignment ON attempts(assignment_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_answers_attempt ON answers(attempt_id);
CREATE INDEX idx_anticheat_attempt ON anti_cheat_events(attempt_id);
CREATE INDEX idx_appeals_attempt ON appeals(attempt_id);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_cert_requests_user ON certificate_requests(user_id);
CREATE INDEX idx_cert_requests_status ON certificate_requests(status);
CREATE INDEX idx_user_certs_user ON user_certificates(user_id);

-- ============================================================
-- Seed: default ranks
-- ============================================================
INSERT INTO ranks (name, level, can_grade) VALUES
  ('Officer', 1, false),
  ('Senior Officer', 2, false),
  ('Corporal', 3, false),
  ('Sergeant', 4, false),
  ('Commander', 10, true);
