-- ============================================================
-- POLICE EXAM PORTAL — FULL SUPABASE DATABASE MIGRATION & SEED
-- Hỗ trợ đa sở: SASP (State Police), BCSO (Sheriff), LSPD (Los Santos)
-- ============================================================

-- Bật extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Xóa bảng cũ nếu cần tái thiết lập (theo thứ tự khóa ngoại)
DROP TABLE IF EXISTS appeals CASCADE;
DROP TABLE IF EXISTS anti_cheat_events CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS exam_assignments CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS user_certificates CASCADE;
DROP TABLE IF EXISTS certificate_requests CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS ranks CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- -----------------------------------------------------------
-- 1. Departments (Danh mục Sở Cảnh Sát)
-- -----------------------------------------------------------
CREATE TABLE departments (
  id VARCHAR(20) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(100) NOT NULL,
  logo TEXT NOT NULL,
  description TEXT,
  badge_color VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 2. Ranks (Hệ thống Cấp bậc theo Sở)
-- -----------------------------------------------------------
CREATE TABLE ranks (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL,
  can_grade BOOLEAN NOT NULL DEFAULT false,
  department_id VARCHAR(20) REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 3. Users (Tài khoản Sĩ quan & Quản trị)
-- -----------------------------------------------------------
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  callsign VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT '123456',
  rank_id VARCHAR(50) REFERENCES ranks(id) ON DELETE SET NULL,
  roles TEXT[] NOT NULL DEFAULT '{OFFICER}',
  department_id VARCHAR(20) REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  duty_note TEXT,
  avatar_url TEXT,
  personal_photo_url TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 4. Certificates (Danh mục Chứng chỉ nghiệp vụ)
-- -----------------------------------------------------------
CREATE TABLE certificates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 5. Exams (Đề thi sát hạch)
-- -----------------------------------------------------------
CREATE TABLE exams (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('promotion', 'certificate', 'general')),
  department_id VARCHAR(20),
  target_rank_id VARCHAR(50) REFERENCES ranks(id) ON DELETE SET NULL,
  certificate_id VARCHAR(50) REFERENCES certificates(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  pass_score NUMERIC(5,2) NOT NULL DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 6. Questions (Câu hỏi đề thi)
-- -----------------------------------------------------------
CREATE TABLE questions (
  id VARCHAR(50) PRIMARY KEY,
  exam_id VARCHAR(50) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('mcq', 'essay', 'true_false_explain')),
  text TEXT NOT NULL,
  points NUMERIC(5,2) NOT NULL DEFAULT 1,
  options JSONB,
  correct_option_id VARCHAR(50),
  correct_boolean BOOLEAN,
  grader_note TEXT,
  min_words INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 7. Exam Assignments (Phân công đề thi cho Sĩ quan)
-- -----------------------------------------------------------
CREATE TABLE exam_assignments (
  id VARCHAR(50) PRIMARY KEY,
  exam_id VARCHAR(50) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'graded', 'cancelled'))
);

-- -----------------------------------------------------------
-- 8. Attempts (Phiên làm bài thi)
-- -----------------------------------------------------------
CREATE TABLE attempts (
  id VARCHAR(50) PRIMARY KEY,
  assignment_id VARCHAR(50) NOT NULL REFERENCES exam_assignments(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id VARCHAR(50) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  exam_code VARCHAR(10) NOT NULL,
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
-- 9. Answers (Chi tiết câu trả lời)
-- -----------------------------------------------------------
CREATE TABLE answers (
  id VARCHAR(50) PRIMARY KEY,
  attempt_id VARCHAR(50) NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(50) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id VARCHAR(50),
  selected_boolean BOOLEAN,
  text_answer TEXT,
  auto_points NUMERIC(5,2),
  manual_points NUMERIC(5,2),
  grader_comment TEXT,
  graded_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 10. Anti-cheat events (Nhật ký giám sát chống gian lận)
-- -----------------------------------------------------------
CREATE TABLE anti_cheat_events (
  id VARCHAR(50) PRIMARY KEY,
  attempt_id VARCHAR(50) NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('leave', 'return', 'warning', 'auto_submit')),
  reason VARCHAR(30) CHECK (reason IN ('tab_hidden', 'window_blur', 'page_leave')),
  device VARCHAR(20) CHECK (device IN ('desktop', 'mobile')),
  away_seconds NUMERIC(10,2),
  user_agent TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 11. Appeals (Đơn khiếu nại & phúc khảo)
-- -----------------------------------------------------------
CREATE TABLE appeals (
  id VARCHAR(50) PRIMARY KEY,
  attempt_id VARCHAR(50) NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'regraded')),
  decided_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  decided_note TEXT,
  previous_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- -----------------------------------------------------------
-- 12. Certificate requests (Yêu cầu cấp chứng chỉ)
-- -----------------------------------------------------------
CREATE TABLE certificate_requests (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_id VARCHAR(50) NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note TEXT,
  decided_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 13. User certificates (Chứng chỉ đã cấp)
-- -----------------------------------------------------------
CREATE TABLE user_certificates (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_id VARCHAR(50) NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  attempt_id VARCHAR(50) REFERENCES attempts(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Cho phép truy cập công khai
-- ============================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access departments" ON departments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access ranks" ON ranks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access users" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access certificates" ON certificates FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access exams" ON exams FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access questions" ON questions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access exam_assignments" ON exam_assignments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access attempts" ON attempts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access answers" ON answers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE anti_cheat_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access anti_cheat_events" ON anti_cheat_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access appeals" ON appeals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE certificate_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access certificate_requests" ON certificate_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access user_certificates" ON user_certificates FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================================

-- 1. Departments
INSERT INTO departments (id, code, name, short_name, logo, description, badge_color) VALUES
  ('sasp', 'SASP', 'San Andreas State Police', 'Cảnh Sát Tiểu Bang SASP', '/sasplogo.png', 'Lực lượng Cảnh sát Tiểu bang San Andreas có thẩm quyền giám sát liên hạt và quản lý toàn bang.', 'from-blue-900 to-indigo-950'),
  ('bcso', 'BCSO', 'Blaine County Sheriff''s Office', 'Cảnh Sát Trưởng Hạt BCSO', '/sherifflogo.png', 'Văn phòng Cảnh sát Trưởng Hạt Blaine quản lý an ninh trật tự, tuần tra khu vực nông thôn và sa mạc.', 'from-amber-800 to-yellow-950'),
  ('lspd', 'LSPD', 'Los Santos Police Department', 'Cảnh Sát Thành Phố LSPD', '/lspd.png', 'Sở Cảnh sát Thành phố Los Santos phụ trách an ninh trật tự, tuần tra nội đô, khu trung tâm thương mại và đô thị.', 'from-blue-800 to-slate-900')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo;

-- 2. Ranks (SASP, BCSO, LSPD)
INSERT INTO ranks (id, name, level, can_grade, department_id) VALUES
  -- SASP
  ('rank-sasp-1', 'State Trooper', 1, false, 'sasp'),
  ('rank-sasp-2', 'Senior Trooper', 2, false, 'sasp'),
  ('rank-sasp-3', 'Corporal', 3, false, 'sasp'),
  ('rank-sasp-4', 'Sergeant', 4, false, 'sasp'),
  ('rank-sasp-5', 'Lieutenant', 5, false, 'sasp'),
  ('rank-sasp-6', 'Captain', 6, true, 'sasp'),
  ('rank-sasp-7', 'Major', 7, true, 'sasp'),
  ('rank-sasp-10', 'Colonel / Superintendent', 10, true, 'sasp'),
  -- BCSO
  ('rank-bcso-1', 'Deputy Sheriff', 1, false, 'bcso'),
  ('rank-bcso-2', 'Senior Deputy', 2, false, 'bcso'),
  ('rank-bcso-3', 'Corporal', 3, false, 'bcso'),
  ('rank-bcso-4', 'Sergeant', 4, false, 'bcso'),
  ('rank-bcso-5', 'Lieutenant', 5, false, 'bcso'),
  ('rank-bcso-6', 'Captain', 6, true, 'bcso'),
  ('rank-bcso-9', 'Undersheriff', 9, true, 'bcso'),
  ('rank-bcso-10', 'Sheriff', 10, true, 'bcso'),
  -- LSPD
  ('rank-lspd-1', 'Police Officer I', 1, false, 'lspd'),
  ('rank-lspd-2', 'Police Officer II', 2, false, 'lspd'),
  ('rank-lspd-3', 'Police Officer III', 3, false, 'lspd'),
  ('rank-lspd-4', 'Sergeant I', 4, false, 'lspd'),
  ('rank-lspd-5', 'Sergeant II', 5, false, 'lspd'),
  ('rank-lspd-6', 'Lieutenant', 6, true, 'lspd'),
  ('rank-lspd-7', 'Captain', 7, true, 'lspd'),
  ('rank-lspd-8', 'Commander', 8, true, 'lspd'),
  ('rank-lspd-9', 'Deputy Chief', 9, true, 'lspd'),
  ('rank-lspd-10', 'Chief of Police', 10, true, 'lspd')
ON CONFLICT (id) DO NOTHING;

-- 3. Users (Mật khẩu mặc định: 123456)
INSERT INTO users (id, callsign, full_name, password_hash, rank_id, roles, department_id, is_active, duty_note) VALUES
  ('user-admin', 'admin', 'Đại tá Trần Minh Tuấn (Admin SASP)', '123456', 'rank-sasp-10', '{ADMIN,GRADER,OFFICER}', 'sasp', true, 'Phụ trách đào tạo và sát hạch nghiệp vụ toàn tiểu bang (SASP, LSPD & BCSO).'),
  ('user-grader-sasp', 'grader01', 'Trung tá Lê Hoàng Nam (Cán bộ Chấm thi SASP)', '123456', 'rank-sasp-6', '{GRADER,OFFICER}', 'sasp', true, 'Hội đồng chấm thi sát hạch Cảnh sát Tiểu bang.'),
  ('user-sheriff-bcso', 'sheriff01', 'Cảnh sát Trưởng Jack Wade (Sheriff BCSO)', '123456', 'rank-bcso-10', '{GRADER,OFFICER}', 'bcso', true, 'Chỉ huy trưởng Văn phòng Cảnh sát Trưởng Hạt Blaine.'),
  ('user-officer-1', 'officer99', 'Phó cảnh sát trưởng Nguyễn Văn An (Deputy BCSO)', '123456', 'rank-bcso-1', '{OFFICER}', 'bcso', true, 'Đã hoàn thành 120 giờ tuần tra vũ trang nông thôn Hạt Blaine.'),
  ('user-officer-2', 'officer88', 'Hạ sĩ quan Phạm Quỳnh Trang (Trooper SASP)', '123456', 'rank-sasp-2', '{OFFICER}', 'sasp', true, 'Đủ điều kiện dự thi thăng cấp lên Corporal SASP.'),
  ('user-chief-lspd', 'chief01', 'Cảnh sát trưởng David Ross (Chief LSPD)', '123456', 'rank-lspd-10', '{GRADER,OFFICER}', 'lspd', true, 'Tổng chỉ huy Sở Cảnh sát Thành phố Los Santos (Mission Row Station).'),
  ('user-officer-lspd', 'officer77', 'Sĩ quan Michael Evans (Officer II LSPD)', '123456', 'rank-lspd-2', '{OFFICER}', 'lspd', true, 'Đội tuần tra phản ứng nhanh đô thị trung tâm Los Santos.')
ON CONFLICT (id) DO NOTHING;

-- 4. Certificates
INSERT INTO certificates (id, name, description, is_active) VALUES
  ('cert-1', 'Sử dụng Vũ khí Quân dụng Cấp 1', 'Kỹ năng tác chiến, an toàn xạ kích súng ngắn tiêu chuẩn và súng trường carbine.', true),
  ('cert-2', 'Sơ cấp cứu & Cứu nạn Hiện trường', 'Kỹ thuật hồi sinh tim phổi CPR, cầm máu dập xung, cứu người bị nạn khi có vũ lực.', true),
  ('cert-3', 'Kỹ thuật Điều tra Hiện trường Vụ án', 'Bảo vệ dấu vết hình sự, thu thập mẫu vật chứng và lập biên bản tố tụng.', true),
  ('cert-4', 'Lái xe Đặc chủng & Truy đuổi Địa hình BCSO', 'Kỹ năng điều khiển phương tiện tuần tra trên địa hình sa mạc, đồi núi cát sỏi Hạt Blaine.', true),
  ('cert-5', 'Chặn bắt Tốc độ cao Cao tốc SASP', 'Chiến thuật chặn bắt PIT maneuver tốc độ cao trên hệ thống đường cao tốc liên bang.', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Exams
INSERT INTO exams (id, title, type, department_id, duration_minutes, pass_score, status, created_by) VALUES
  ('exam-1', 'Kiểm tra Pháp luật & Quy tắc Thi hành Công vụ Cơ bản (Chung toàn lực lượng)', 'general', 'all', 45, 5, 'published', 'user-admin'),
  ('exam-2', 'Sát hạch Thăng cấp SASP: Sĩ quan lên Senior Trooper', 'promotion', 'sasp', 60, 6, 'published', 'user-admin'),
  ('exam-3', 'Sát hạch Nghiệp vụ Tuần tra Nông thôn & Sa mạc (BCSO Sheriff)', 'general', 'bcso', 50, 6, 'published', 'user-sheriff-bcso'),
  ('exam-4', 'Sát hạch Tác chiến Đô thị & Kiểm soát Trật tự Los Santos (LSPD Metro)', 'general', 'lspd', 50, 6, 'published', 'user-chief-lspd')
ON CONFLICT (id) DO NOTHING;
