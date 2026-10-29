// Vercel Serverless Function: /api/attempts/* & /api/anticheat/*
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractAuthUser } from './_lib/jwt.js';
import { supabaseQuery, supabaseInsert, supabaseUpdate } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = extractAuthUser(req);
  if (!user) return res.status(401).json({ message: 'Yêu cầu đăng nhập' });

  const url = req.url || '';

  // 1. POST /api/attempts/start
  if (req.method === 'POST' && url.includes('/start')) {
    const { assignmentId } = req.body || {};
    try {
      const assignments = await supabaseQuery<any>(
        'exam_assignments',
        `?id=eq.${assignmentId}&limit=1`
      );
      if (assignments.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy lượt giao bài' });
      }
      const assign = assignments[0];
      const exams = await supabaseQuery<any>('exams', `?id=eq.${assign.exam_id}&limit=1`);
      const exam = exams[0];

      const questions = await supabaseQuery<any>(
        'questions',
        `?exam_id=eq.${exam.id}&order=order_index.asc`
      );

      // Shuffle
      const questionOrder = questions.map((q) => q.id).sort(() => Math.random() - 0.5);
      const optionOrders: Record<string, string[]> = {};
      questions.forEach((q) => {
        if (q.options && q.options.length > 0) {
          optionOrders[q.id] = q.options.map((o: any) => o.id).sort(() => Math.random() - 0.5);
        }
      });

      const now = new Date();
      const deadline = new Date(now.getTime() + exam.duration_minutes * 60 * 1000);
      const examCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const attempt = await supabaseInsert<any>('attempts', {
        assignment_id: assign.id,
        user_id: user.userId,
        exam_id: exam.id,
        exam_code: examCode,
        question_order: questionOrder,
        option_orders: optionOrders,
        started_at: now.toISOString(),
        deadline_at: deadline.toISOString(),
        status: 'in_progress',
      });

      await supabaseUpdate('exam_assignments', `id=eq.${assign.id}`, { status: 'in_progress' });
      return res.status(200).json(attempt);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // 2. GET /api/attempts/:id
  if (req.method === 'GET' && !url.includes('/start')) {
    const parts = url.split('/');
    const attemptId = parts[parts.length - 1].split('?')[0];

    try {
      const attempts = await supabaseQuery<any>('attempts', `?id=eq.${attemptId}&limit=1`);
      if (attempts.length === 0) return res.status(404).json({ message: 'Không tìm thấy attempt' });
      const attempt = attempts[0];

      const exams = await supabaseQuery<any>('exams', `?id=eq.${attempt.exam_id}&limit=1`);
      const exam = exams[0];

      // Sanitize: KHÔNG gửi correct_option_id, correct_boolean hay grader_note khi đang thi!
      const questions = await supabaseQuery<any>(
        'questions',
        `?exam_id=eq.${exam.id}&select=id,exam_id,order_index,type,text,points,options,min_words`
      );

      const answers = await supabaseQuery<any>('answers', `?attempt_id=eq.${attempt.id}`);

      return res.status(200).json({
        attempt,
        exam: { ...exam, questions },
        answers,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // 3. POST /api/attempts/:id/submit
  if (req.method === 'POST' && url.includes('/submit')) {
    const parts = url.split('/');
    const attemptId = parts[parts.length - 2];
    const { submit_reason = 'manual' } = req.body || {};

    try {
      const attempts = await supabaseQuery<any>('attempts', `?id=eq.${attemptId}&limit=1`);
      if (attempts.length === 0) return res.status(404).json({ message: 'Không tìm thấy lượt thi' });
      const attempt = attempts[0];

      const exams = await supabaseQuery<any>('exams', `?id=eq.${attempt.exam_id}&limit=1`);
      const exam = exams[0];

      const questions = await supabaseQuery<any>('questions', `?exam_id=eq.${exam.id}`);
      const answers = await supabaseQuery<any>('answers', `?attempt_id=eq.${attempt.id}`);

      let autoScore = 0;
      let hasEssay = false;

      for (const q of questions) {
        const userAns = answers.find((a: any) => a.question_id === q.id);
        if (q.type === 'mcq') {
          if (userAns && userAns.selected_option_id === q.correct_option_id) {
            const pts = Number(q.points) || 0;
            autoScore += pts;
            await supabaseUpdate('answers', `id=eq.${userAns.id}`, { auto_points: pts }).catch(() => {});
          } else if (userAns) {
            await supabaseUpdate('answers', `id=eq.${userAns.id}`, { auto_points: 0 }).catch(() => {});
          }
        } else {
          hasEssay = true;
        }
      }

      const updateData: any = {
        submitted_at: new Date().toISOString(),
        submit_reason,
        auto_score: autoScore,
      };

      if (!hasEssay) {
        updateData.final_score = autoScore;
        updateData.passed = autoScore >= exam.pass_score;
        updateData.status = 'graded';
      } else {
        updateData.status = 'submitted';
      }

      const updated = await supabaseUpdate<any>(
        'attempts',
        `id=eq.${attemptId}`,
        updateData
      );

      // Cập nhật trạng thái phân công
      await supabaseUpdate(
        'exam_assignments',
        `id=eq.${attempt.assignment_id}`,
        { status: updateData.status }
      ).catch(() => {});

      return res.status(200).json({ attempt: updated });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  return res.status(404).json({ message: 'Endpoint not found' });
}
