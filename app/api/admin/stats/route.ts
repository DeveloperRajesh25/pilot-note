import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const db = createAdminClient();

  const [
    { count: userCount },
    { count: purchaseCount },
    { data: purchasesRaw },
    { count: aptitudeCount },
    { count: rtrCount },
    { count: examRegCount },
    { data: recentUsers },
    { data: recentPurchases },
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('user_purchases').select('id', { count: 'exact', head: true }),
    db.from('user_purchases').select('amount'),
    db.from('aptitude_results').select('id', { count: 'exact', head: true }),
    db.from('rtr_results').select('id', { count: 'exact', head: true }),
    db.from('exam_registrations').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('user_purchases').select('id, user_id, test_id, amount, purchased_at, rtr_tests(title)').order('purchased_at', { ascending: false }).limit(5),
  ]);

  const totalRevenue = ((purchasesRaw ?? []) as { amount: number | null }[]).reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0,
  );

  return NextResponse.json({
    stats: {
      totalUsers: userCount ?? 0,
      totalRevenue,
      totalPurchases: purchaseCount ?? 0,
      aptitudeAttempts: aptitudeCount ?? 0,
      rtrAttempts: rtrCount ?? 0,
      examRegistrations: examRegCount ?? 0,
    },
    recentUsers: recentUsers ?? [],
    recentPurchases: recentPurchases ?? [],
  });
}
