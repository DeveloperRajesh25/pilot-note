import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;

  const db = createAdminClient();

  const [
    { data: authUser },
    { data: profile },
    { data: purchases },
    { data: rtrResults },
    { data: aptitudeResults },
    { data: examAttempts },
    { data: adminRole },
  ] = await Promise.all([
    db.auth.admin.getUserById(id),
    db.from('profiles').select('*').eq('id', id).maybeSingle(),
    db.from('user_purchases').select('*, rtr_tests(title)').eq('user_id', id).order('purchased_at', { ascending: false }),
    db.from('rtr_results').select('*, rtr_tests(title)').eq('user_id', id).order('created_at', { ascending: false }),
    db.from('aptitude_results').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    db.from('exam_attempts').select('*, exams(title, subject)').eq('user_id', id).order('started_at', { ascending: false }),
    db.from('admin_roles').select('id').eq('user_id', id).maybeSingle(),
  ]);

  if (!authUser.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    user: {
      id: authUser.user.id,
      email: authUser.user.email,
      full_name: profile?.full_name,
      created_at: authUser.user.created_at,
      last_sign_in: authUser.user.last_sign_in_at,
      emailConfirmed: !!authUser.user.email_confirmed_at,
      isAdmin: !!adminRole,
    },
    purchases: purchases ?? [],
    rtrResults: rtrResults ?? [],
    aptitudeResults: aptitudeResults ?? [],
    examAttempts: examAttempts ?? [],
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;

  const body = await request.json();
  const { action } = body; // 'make_admin' | 'remove_admin' | 'delete'
  const db = createAdminClient();

  if (action === 'make_admin') {
    await db.from('admin_roles').upsert({ user_id: id }, { onConflict: 'user_id' });
    return NextResponse.json({ success: true, message: 'User is now admin' });
  }

  if (action === 'remove_admin') {
    await db.from('admin_roles').delete().eq('user_id', id);
    return NextResponse.json({ success: true, message: 'Admin role removed' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;

  const db = createAdminClient();
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
