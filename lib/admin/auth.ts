import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Verifies the current request user is an admin.
 * Returns { user, isAdmin: true } or a 401/403 NextResponse.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email: string | undefined }; error: null }
  | { user: null; error: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // Check admin_roles table
  const { data: role } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!role) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 }),
    };
  }

  return { user: { id: user.id, email: user.email }, error: null };
}
