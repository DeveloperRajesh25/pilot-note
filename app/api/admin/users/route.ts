import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  const db = createAdminClient();

  // Get users from auth.users via admin API
  const { data: authUsers, error: authErr } = await db.auth.admin.listUsers({ page, perPage: limit });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  const userIds = authUsers.users.map((u: User) => u.id);

  // Get profiles
  const { data: profiles } = await db.from('profiles').select('*').in('id', userIds);
  const profileMap: Record<string, ProfileRow> = Object.fromEntries(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  // Get purchase counts
  const { data: purchaseCounts } = await db
    .from('user_purchases')
    .select('user_id')
    .in('user_id', userIds);
  const purchaseMap: Record<string, number> = {};
  ((purchaseCounts ?? []) as { user_id: string }[]).forEach((p) => {
    purchaseMap[p.user_id] = (purchaseMap[p.user_id] || 0) + 1;
  });

  // Get admin roles
  const { data: adminRoles } = await db.from('admin_roles').select('user_id');
  const adminSet = new Set(((adminRoles ?? []) as { user_id: string }[]).map((r) => r.user_id));

  let users = authUsers.users.map((u: User) => ({
    id: u.id,
    email: u.email,
    full_name: profileMap[u.id]?.full_name || null,
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
    purchases: purchaseMap[u.id] || 0,
    isAdmin: adminSet.has(u.id),
    emailConfirmed: !!u.email_confirmed_at,
  }));

  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) => u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q));
  }

  return NextResponse.json({
    users,
    total: authUsers.total ?? users.length,
    page,
  });
}
