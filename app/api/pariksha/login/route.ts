import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { dobToPassword, EXAM_COOKIE, signSession } from '@/lib/exam-session';

interface Body {
  roll_no?: string;
  password?: string;          // DDMMYYYY
  exam_id?: string;           // optional hint — when omitted, we look up by roll_no
}

// Constant-time-ish error to make response timing less informative.
function authErr() {
  return NextResponse.json(
    { error: 'Roll number and password do not match. Check the credentials email and try again.' },
    { status: 401 }
  );
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rollNo = (body.roll_no ?? '').trim();
  const password = (body.password ?? '').trim();
  if (!rollNo || !password) {
    return NextResponse.json({ error: 'Roll number and password are required.' }, { status: 400 });
  }

  const db = createAdminClient();

  let query = db
    .from('exam_registrations')
    .select('id, user_id, exam_id, dob, roll_no')
    .eq('roll_no', rollNo);
  if (body.exam_id) query = query.eq('exam_id', body.exam_id);

  const { data: reg } = await query.maybeSingle();
  if (!reg || !reg.dob) return authErr();

  const expected = dobToPassword(reg.dob);
  // Constant-length compare: pad both to a safe length.
  if (expected.length !== password.length) return authErr();
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ password.charCodeAt(i);
  }
  if (diff !== 0) return authErr();

  // Build the signed session cookie.
  const token = signSession(reg.user_id, reg.exam_id);
  const res = NextResponse.json({
    ok: true,
    exam_id: reg.exam_id,
    redirect: `/pariksha/${reg.exam_id}`,
  });
  res.cookies.set(EXAM_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 6 * 60 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(EXAM_COOKIE);
  return res;
}
