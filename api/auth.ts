// Vercel Serverless Function: /api/auth/*
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signToken, extractAuthUser } from './_lib/jwt';
import { supabaseQuery } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const subRoute = Array.isArray(path) ? path.join('/') : path || '';

  // 1. POST /api/auth/login
  if (req.method === 'POST' && (subRoute === 'login' || req.url?.includes('login'))) {
    const { callsign, password, role } = req.body || {};
    const norm = (callsign || '').trim().toLowerCase();

    try {
      const users = await supabaseQuery<any>('users', `?callsign=eq.${norm}&limit=1`);
      if (users.length === 0) {
        return res.status(401).json({ message: 'Số hiệu hoặc mật khẩu không chính xác' });
      }

      const user = users[0];
      if (!user.is_active) {
        return res.status(403).json({ message: 'Tài khoản đã bị tạm khóa' });
      }

      if (!user.roles.includes(role)) {
        return res.status(403).json({ message: `Tài khoản không có vai trò ${role}` });
      }

      // Payload
      const payload = {
        userId: user.id,
        callsign: user.callsign,
        role,
        roles: user.roles,
        fullName: user.full_name,
        rankId: user.rank_id,
        duty_note: user.duty_note,
      };

      const token = signToken(payload);

      // Set HttpOnly, Secure, SameSite=Lax cookie
      res.setHeader(
        'Set-Cookie',
        `pd_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}; Secure`
      );

      return res.status(200).json({ user: payload });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // 2. GET /api/auth/me
  if (req.method === 'GET' && (subRoute === 'me' || req.url?.includes('me'))) {
    const user = extractAuthUser(req);
    if (!user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    return res.status(200).json({ user });
  }

  // 3. POST /api/auth/logout
  if (req.method === 'POST' && (subRoute === 'logout' || req.url?.includes('logout'))) {
    res.setHeader(
      'Set-Cookie',
      'pd_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure'
    );
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ message: 'Not found' });
}

