'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${id}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleAction = async (action: 'make_admin' | 'remove_admin' | 'delete') => {
    if (action === 'delete' && !confirm('Permanently delete this user?')) return;
    setActionLoading(true);
    try {
      if (action === 'delete') {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        window.location.href = '/admin/users';
      } else {
        await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        await fetchUser();
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-violet border-t-transparent rounded-full animate-spin" /></div>;
  if (!data?.user) return <div className="text-rose-400 py-20 text-center">User not found</div>;

  const { user, purchases, rtrResults, aptitudeResults, examAttempts } = data;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/users" className="text-neutral-400 hover:text-white transition-colors">← Users</Link>
        <h1 className="text-3xl font-black text-white">{user.full_name || user.email}</h1>
        {user.isAdmin && <span className="px-3 py-1 bg-violet/20 text-violet text-xs font-black rounded-full border border-violet/30">ADMIN</span>}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="w-16 h-16 bg-violet/20 rounded-full flex items-center justify-center text-violet text-2xl font-black mb-4">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <h2 className="text-lg font-black text-white mb-1">{user.full_name || 'No name set'}</h2>
          <p className="text-neutral-400 text-sm mb-4">{user.email}</p>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between"><span className="text-neutral-500">Joined</span><span className="text-white">{new Date(user.created_at).toLocaleDateString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Last login</span><span className="text-white">{user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString('en-IN') : '—'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Verified</span><span className={user.emailConfirmed ? 'text-emerald-400' : 'text-amber-400'}>{user.emailConfirmed ? '✓ Yes' : '✗ No'}</span></div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleAction(user.isAdmin ? 'remove_admin' : 'make_admin')}
              disabled={actionLoading}
              className="w-full py-2 px-4 rounded-xl text-sm font-bold bg-violet/20 text-violet hover:bg-violet/30 transition-colors disabled:opacity-50"
            >
              {user.isAdmin ? 'Remove Admin' : 'Grant Admin Access'}
            </button>
            <button
              onClick={() => handleAction('delete')}
              disabled={actionLoading}
              className="w-full py-2 px-4 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
            >
              Delete User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
          {[
            { label: 'RTR Tests Purchased', value: purchases.length, color: 'emerald' },
            { label: 'RTR Exam Attempts', value: rtrResults.length, color: 'blue' },
            { label: 'Aptitude Tests', value: aptitudeResults.length, color: 'violet' },
            { label: 'Exam Attempts', value: examAttempts.length, color: 'orange' },
          ].map(s => (
            <div key={s.label} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
              <p className="text-3xl font-black text-white mb-1">{s.value}</p>
              <p className="text-sm text-neutral-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Purchases */}
      {purchases.length > 0 && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
          <h3 className="font-black text-white mb-4">Purchases</h3>
          <div className="space-y-2">
            {purchases.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                <p className="text-sm text-white">{p.rtr_tests?.title ?? p.test_id}</p>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-bold text-sm">₹{p.amount}</span>
                  <span className="text-neutral-500 text-xs">{new Date(p.purchased_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RTR Results */}
      {rtrResults.length > 0 && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
          <h3 className="font-black text-white mb-4">RTR Results</h3>
          <div className="space-y-2">
            {rtrResults.map((r: any) => {
              const pct = Math.round((r.score / r.total) * 100);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                  <div>
                    <p className="text-sm text-white">{r.rtr_tests?.title}</p>
                    <p className="text-xs text-neutral-500">{r.part === 'part1' ? 'Part 1 — MCQ' : 'Part 2 — RT'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${pct >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>{pct}%</p>
                    <p className="text-xs text-neutral-500">{r.score}/{r.total}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aptitude Results */}
      {aptitudeResults.length > 0 && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <h3 className="font-black text-white mb-4">Aptitude Results</h3>
          <div className="space-y-2">
            {aptitudeResults.map((r: any) => {
              const pct = Math.round((r.score / r.total) * 100);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                  <p className="text-sm text-white">{r.category}</p>
                  <div className="text-right">
                    <p className={`font-black text-sm ${pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{pct}%</p>
                    <p className="text-xs text-neutral-500">{r.score}/{r.total}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
