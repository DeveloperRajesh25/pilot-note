/**
 * Pariksha exam-session cookie. Used when a candidate logs in with their
 * roll number + DOB (not their regular PilotNote password). Issued by
 * /api/pariksha/login and honored by the exam routes.
 *
 * Cookie name: pn_exam_sess
 * Payload: { user_id, exam_id, exp } (HMAC-SHA256 signed)
 *
 * NOTE: This is *additive* to the standard Supabase auth session. Users
 * who are already signed in to their PilotNote account skip this cookie
 * entirely — the regular supabase.auth.getUser() works as before. The
 * cookie is only consulted as a fallback when supabase has no user.
 */

import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const EXAM_COOKIE = 'pn_exam_sess';
const DEFAULT_TTL_SECONDS = 6 * 60 * 60; // 6h — covers any exam window comfortably

interface SessionPayload {
  uid: string;       // user_id
  eid: string;       // exam_id
  exp: number;       // epoch seconds
}

function secret(): string {
  const s = process.env.PARIKSHA_SESSION_SECRET;
  if (!s) throw new Error('PARIKSHA_SESSION_SECRET not set');
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): Buffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function signSession(uid: string, eid: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const payload: SessionPayload = {
    uid,
    eid,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const json = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(json).digest());
  return `${json}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  const [json, sig] = token.split('.');
  if (!json || !sig) return null;
  const expected = b64url(crypto.createHmac('sha256', secret()).update(json).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(b64urlDecode(json).toString()) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.uid !== 'string' || typeof payload.eid !== 'string') return null;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

/**
 * Read the exam-session cookie from the current request and return the payload
 * if valid. Returns null otherwise.
 */
export async function readExamCookie(): Promise<SessionPayload | null> {
  const c = await cookies();
  const raw = c.get(EXAM_COOKIE)?.value;
  if (!raw) return null;
  return verifySession(raw);
}

/**
 * Universal "who is the candidate?" helper for pariksha routes.
 *
 * 1. First tries Supabase auth (regular PilotNote login). If present, returns it.
 * 2. Falls back to the pn_exam_sess cookie. Validates it matches `examId`.
 *
 * Returns { user_id, source } or null.
 */
export async function getExamUser(examId: string): Promise<
  | { user_id: string; email: string | undefined; source: 'supabase' | 'exam_cookie' }
  | null
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { user_id: user.id, email: user.email, source: 'supabase' };

  const payload = await readExamCookie();
  if (!payload) return null;
  if (payload.eid !== examId) return null;

  // Resolve email lazily so callers can prefill it.
  const adminDb = createAdminClient();
  const { data: prof } = await adminDb.from('profiles').select('email').eq('id', payload.uid).maybeSingle();
  return { user_id: payload.uid, email: prof?.email ?? undefined, source: 'exam_cookie' };
}

/** Format a DOB (yyyy-mm-dd from <input type=date>) to DDMMYYYY for password comparison. */
export function dobToPassword(dobIso: string): string {
  const [y, m, d] = dobIso.split('-');
  if (!y || !m || !d) return '';
  return `${d.padStart(2, '0')}${m.padStart(2, '0')}${y}`;
}
