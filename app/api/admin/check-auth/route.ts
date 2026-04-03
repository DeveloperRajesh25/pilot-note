import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false, error: 'User session not found' });
    }

    const adminDb = createAdminClient();
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { data: role, error: roleError } = await adminDb
      .from('admin_roles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      isAdmin: !!role,
      hasServiceKey,
      roleError: roleError?.message || null,
      userId: user.id
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
