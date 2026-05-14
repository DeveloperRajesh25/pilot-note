import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

interface PurchaseAmount { amount: number | null }
interface RecentPurchase {
  id: string;
  amount: number;
  purchased_at: string;
  test_id?: string;
  rtr_tests: { title: string } | null;
  profiles: { email: string | null } | null;
}
interface RecentUser {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}
interface ExamSummary { id: string; title: string; status: string; exam_date: string | null }
interface RTRSummary { id: string; title: string; status: string }

async function getStats() {
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
    { data: rtrTests },
    { data: exams },
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('user_purchases').select('id', { count: 'exact', head: true }),
    db.from('user_purchases').select('amount'),
    db.from('aptitude_results').select('id', { count: 'exact', head: true }),
    db.from('rtr_results').select('id', { count: 'exact', head: true }),
    db.from('exam_registrations').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('user_purchases').select('id, amount, purchased_at, rtr_tests(title), profiles(email)').order('purchased_at', { ascending: false }).limit(8),
    db.from('rtr_tests').select('id, title, status'),
    db.from('exams').select('id, title, status, exam_date'),
  ]);

  const totalRevenue = ((purchasesRaw ?? []) as PurchaseAmount[]).reduce(
    (s, p) => s + (p.amount ?? 0),
    0,
  );
  return {
    userCount,
    purchaseCount,
    totalRevenue,
    aptitudeCount,
    rtrCount,
    examRegCount,
    recentUsers: (recentUsers ?? []) as RecentUser[],
    recentPurchases: (recentPurchases ?? []) as unknown as RecentPurchase[],
    rtrTests: (rtrTests ?? []) as RTRSummary[],
    exams: (exams ?? []) as ExamSummary[],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const kpis = [
    { label: 'Total Users', value: stats.userCount, icon: '👥', color: 'violet', sub: 'registered accounts' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: 'green', sub: `${stats.purchaseCount} purchases` },
    { label: 'Aptitude Attempts', value: stats.aptitudeCount, icon: '🧠', color: 'blue', sub: 'tests taken' },
    { label: 'RTR Attempts', value: stats.rtrCount, icon: '📡', color: 'orange', sub: 'exam submissions' },
    { label: 'Exam Registrations', value: stats.examRegCount, icon: '🎓', color: 'pink', sub: 'pariksha signups' },
    { label: 'RTR Tests Available', value: stats.rtrTests.length, icon: '📋', color: 'teal', sub: 'active products' },
  ];

  const colorMap: Record<string, string> = {
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    pink: 'border-pink-200 bg-pink-50 text-pink-700',
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-black text-neutral-900 mb-1">Dashboard Overview</h1>
        <p className="text-neutral-500">Welcome back — here&apos;s everything happening on Pilot Note.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-6 ${colorMap[kpi.color]}`}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{kpi.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">{kpi.sub}</span>
            </div>
            <p className="text-3xl font-black text-neutral-900 mb-1">{kpi.value ?? 0}</p>
            <p className="text-sm font-semibold opacity-80">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-neutral-900 text-lg">Recent Purchases</h2>
            <Link href="/admin/purchases" className="text-xs text-emerald-600 font-bold hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {stats.recentPurchases.length === 0 && (
              <p className="text-neutral-500 text-sm py-4 text-center">No purchases yet</p>
            )}
            {stats.recentPurchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{p.profiles?.email ?? 'Unknown'}</p>
                  <p className="text-xs text-neutral-500">{p.rtr_tests?.title ?? p.test_id ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">₹{p.amount}</p>
                  <p className="text-xs text-neutral-500">{new Date(p.purchased_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-neutral-900 text-lg">Recent Signups</h2>
            <Link href="/admin/users" className="text-xs text-emerald-600 font-bold hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.length === 0 && (
              <p className="text-neutral-500 text-sm py-4 text-center">No users yet</p>
            )}
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700 shrink-0">
                  {u.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-neutral-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <Link href={`/admin/users/${u.id}`} className="text-xs text-emerald-600 hover:underline shrink-0">View</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exams & Tests status */}
      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-neutral-900 text-lg">Pariksha Exams</h2>
            <Link href="/admin/exams" className="text-xs text-emerald-600 font-bold hover:underline">Manage →</Link>
          </div>
          {stats.exams.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <p className="text-sm text-neutral-900 font-medium">{e.title}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                e.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                e.status === 'Completed' ? 'bg-neutral-100 text-neutral-500 border-neutral-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>{e.status}</span>
            </div>
          ))}
          {stats.exams.length === 0 && <p className="text-neutral-500 text-sm text-center py-4">No exams created</p>}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-neutral-900 text-lg">RTR Tests</h2>
            <Link href="/admin/rtr" className="text-xs text-emerald-600 font-bold hover:underline">Manage →</Link>
          </div>
          {stats.rtrTests.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <p className="text-sm text-neutral-900 font-medium">{t.title}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                t.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
              }`}>{t.status}</span>
            </div>
          ))}
          {stats.rtrTests.length === 0 && <p className="text-neutral-500 text-sm text-center py-4">No tests created</p>}
        </div>
      </div>
    </div>
  );
}
