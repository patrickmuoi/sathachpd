-- ============================================================
-- Police Exam Portal — Seed Data (Demo)
-- ============================================================
-- NOTE: User records are seeded via the application seed script
-- (bcrypt hashing), so they are NOT included here.
-- Run this AFTER migration.sql and after user seeding.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Certificates
-- -----------------------------------------------------------
INSERT INTO certificates (id, name, description) VALUES
  ('a1b2c3d4-1111-4000-a000-000000000001', 'Firearms Proficiency',
   'Demonstrates competency in firearm handling, safety protocols, and marksmanship.'),
  ('a1b2c3d4-2222-4000-a000-000000000002', 'First Aid & Emergency Response',
   'Covers basic first aid, CPR, AED usage, and field trauma care.'),
  ('a1b2c3d4-3333-4000-a000-000000000003', 'Tactical Operations',
   'Advanced tactical movement, room clearing, and coordinated team operations.');

-- -----------------------------------------------------------
-- 2. Sample general exam (published, 5 questions, 10 pts)
-- -----------------------------------------------------------
INSERT INTO exams (id, title, type, duration_minutes, pass_score, status) VALUES
  ('e0e0e0e0-0000-4000-b000-000000000001',
   'General Knowledge — Police Procedures & Law',
   'general', 45, 5.00, 'published');

-- -----------------------------------------------------------
-- 3. Questions for the sample exam
-- -----------------------------------------------------------

-- Q1: MCQ – 2 pts
INSERT INTO questions (id, exam_id, order_index, type, text, points, options, correct_option_id) VALUES
  ('q0q0q0q0-0001-4000-c000-000000000001',
   'e0e0e0e0-0000-4000-b000-000000000001',
   1,
   'mcq',
   'Which of the following is the correct procedure when arriving at a crime scene?',
   2.00,
   '[
     {"id": "A", "text": "Immediately begin collecting evidence"},
     {"id": "B", "text": "Secure the perimeter and call for backup"},
     {"id": "C", "text": "Interview witnesses before securing the scene"},
     {"id": "D", "text": "Wait for media to arrive before proceeding"}
   ]'::jsonb,
   'B');

-- Q2: MCQ – 2 pts
INSERT INTO questions (id, exam_id, order_index, type, text, points, options, correct_option_id) VALUES
  ('q0q0q0q0-0002-4000-c000-000000000002',
   'e0e0e0e0-0000-4000-b000-000000000001',
   2,
   'mcq',
   'Under which circumstance is an officer legally permitted to use lethal force?',
   2.00,
   '[
     {"id": "A", "text": "When a suspect is fleeing a misdemeanor"},
     {"id": "B", "text": "When there is an imminent threat of death or serious bodily harm"},
     {"id": "C", "text": "When ordered by a senior officer regardless of context"},
     {"id": "D", "text": "When a suspect verbally threatens an officer"}
   ]'::jsonb,
   'B');

-- Q3: MCQ – 2 pts
INSERT INTO questions (id, exam_id, order_index, type, text, points, options, correct_option_id) VALUES
  ('q0q0q0q0-0003-4000-c000-000000000003',
   'e0e0e0e0-0000-4000-b000-000000000001',
   3,
   'mcq',
   'What does the chain of custody refer to?',
   2.00,
   '[
     {"id": "A", "text": "The hierarchy of command within the department"},
     {"id": "B", "text": "The chronological documentation of evidence handling"},
     {"id": "C", "text": "The order in which suspects are processed"},
     {"id": "D", "text": "The schedule of officer shift rotations"}
   ]'::jsonb,
   'B');

-- Q4: Essay – 2 pts
INSERT INTO questions (id, exam_id, order_index, type, text, points, grader_note, min_words) VALUES
  ('q0q0q0q0-0004-4000-c000-000000000004',
   'e0e0e0e0-0000-4000-b000-000000000001',
   4,
   'essay',
   'Describe the key principles of community policing and explain how they can be applied to reduce crime in a residential neighborhood. Provide at least two concrete examples.',
   2.00,
   'Look for: definition of community policing, mention of trust/partnership with community, at least 2 practical examples (e.g., neighborhood watch, foot patrols, town halls). Award partial credit for incomplete but relevant answers.',
   50);

-- Q5: True/False with explanation – 2 pts
INSERT INTO questions (id, exam_id, order_index, type, text, points, correct_boolean, grader_note, min_words) VALUES
  ('q0q0q0q0-0005-4000-c000-000000000005',
   'e0e0e0e0-0000-4000-b000-000000000001',
   5,
   'true_false_explain',
   'True or False: An officer may conduct a search of a vehicle during a routine traffic stop without a warrant or probable cause. Explain your answer.',
   2.00,
   false,
   'Correct answer is FALSE. The explanation should reference the 4th Amendment or equivalent legal protection, probable cause requirement, and exceptions (plain view, consent, search incident to arrest). Award 0.5 for correct boolean, up to 1.5 for explanation quality.',
   30);
