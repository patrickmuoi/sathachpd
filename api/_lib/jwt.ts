// JWT & Cookie verification helper for Vercel Serverless Functions
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'police-exam-portal-default-secret-key-min-32-chars';

export interface TokenPayload {
  userId: string;
  callsign: string;
  role: string;
  roles: string[];
  fullName: string;
  rankId: string;
}

export function signToken(payload: TokenPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function extractAuthUser(req: any): TokenPayload | null {
  // Extract from cookie or authorization header
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/pd_session=([^;]+)/);
  if (match) {
    return verifyToken(match[1]);
  }
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return verifyToken(auth.substring(7));
  }
  return null;
}

