import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const totalRevenue = (purchasesRaw ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  return { userCount, purchaseCount, totalRevenue, aptitudeCount, rtrCount, examRegCount, recentUsers, recentPurchases, rtrTests, exams };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const kpis = [
    { label: 'Total Users', value: stats.userCount, icon: '👥', color: 'violet', sub: 'registered accounts' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: 'green', sub: `${stats.purchaseCount} purchases` },
    { label: 'Aptitude Attempts', value: stats.aptitudeCount, icon: '🧠', color: 'blue', sub: 'tests taken' },
    { label: 'RTR Attempts', value: stats.rtrCount, icon: '📡', color: 'orange', sub: 'exam submissions' },
    { label: 'Exam Registrations', value: stats.examRegCount, icon: '🎓', color: 'pink', sub: 'pariksha signups' },
    { label: 'RTR Tests Available', value: (stats.rtrTests ?? []).length, icon: '📋', color: 'teal', sub: 'active products' },
  ];

  const colorMap: Record<string, string> = {
    violet: 'border-violet/30 bg-violet/10 text-violet',
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    pink: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
    teal: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-1">Dashboard Overview</h1>
        <p className="text-neutral-400">Welcome back — here's everything happening on Pilot Note.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-6 ${colorMap[kpi.color]}`}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{kpi.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">{kpi.sub}</span>
            </div>
            <p className="text-3xl font-black text-white mb-1">{kpi.value ?? 0}</p>
            <p className="text-sm font-semibold opacity-80">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Purchases */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-white text-lg">Recent Purchases</h2>
            <a href="/admin/purchases" className="text-xs text-violet font-bold hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {(stats.recentPurchases ?? []).length === 0 && (
              <p className="text-neutral-500 text-sm py-4 text-center">No purchases yet</p>
            )}
            {(stats.recentPurchases ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-white">{(p.profiles as any)?.email ?? 'Unknown'}</p>
                  <p className="text-xs text-neutral-500">{(p.rtr_tests as any)?.title ?? p.test_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">₹{p.amount}</p>
                  <p className="text-xs text-neutral-500">{new Date(p.purchased_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-white text-lg">Recent Signups</h2>
            <a href="/admin/users" className="text-xs text-violet font-bold hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {(stats.recentUsers ?? []).length === 0 && (
              <p className="text-neutral-500 text-sm py-4 text-center">No users yet</p>
            )}
            {(stats.recentUsers ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 py-3 border-b border-neutral-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300 flex-shrink-0">
                  {(u.email as string)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-neutral-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <a href={`/admin/users/${u.id}`} className="text-xs text-violet hover:underline flex-shrink-0">View</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exams & Tests status */}
      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-white text-lg">Pariksha Exams</h2>
            <a href="/admin/exams" className="text-xs text-violet font-bold hover:underline">Manage →</a>
          </div>
          {(stats.exams ?? []).map((e: any) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
              <p className="text-sm text-white font-medium">{e.title}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                e.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                e.status === 'Completed' ? 'bg-neutral-700 text-neutral-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>{e.status}</span>
            </div>
          ))}
          {(stats.exams ?? []).length === 0 && <p className="text-neutral-500 text-sm text-center py-4">No exams created</p>}
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-white text-lg">RTR Tests</h2>
            <a href="/admin/rtr" className="text-xs text-violet font-bold hover:underline">Manage →</a>
          </div>
          {(stats.rtrTests ?? []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
              <p className="text-sm text-white font-medium">{t.title}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                t.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700 text-neutral-400'
              }`}>{t.status}</span>
            </div>
          ))}
          {(stats.rtrTests ?? []).length === 0 && <p className="text-neutral-500 text-sm text-center py-4">No tests created</p>}
        </div>
      </div>
    </div>
  );
}
