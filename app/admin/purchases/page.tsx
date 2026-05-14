'use client';

import { useState, useEffect } from 'react';
import type { UserPurchase } from '@/lib/types';

type PurchaseRow = UserPurchase & {
  profiles?: { email: string | null; full_name: string | null } | null;
  rtr_tests?: { title: string } | null;
};

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/purchases')
      .then(r => r.json())
      .then(d => { setPurchases(d.purchases ?? []); setLoading(false); });
  }, []);

  const filtered = purchases.filter(p => {
    const q = search.toLowerCase();
    return !q || p.profiles?.email?.toLowerCase().includes(q) || p.rtr_tests?.title?.toLowerCase().includes(q);
  });

  const totalRevenue = purchases.reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">Purchases</h1>
          <p className="text-neutral-500">{purchases.length} total sales · ₹{totalRevenue.toLocaleString('en-IN')} revenue</p>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <p className="text-3xl font-black text-emerald-700">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-sm text-emerald-700/80 mt-1">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-3xl font-black text-neutral-900">{purchases.length}</p>
          <p className="text-sm text-neutral-500 mt-1">Total Purchases</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-3xl font-black text-neutral-900">₹{purchases.length ? Math.round(totalRevenue / purchases.length) : 0}</p>
          <p className="text-sm text-neutral-500 mt-1">Avg. Order Value</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by user email or test name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-500 rounded-xl py-2.5 px-4 focus:outline-none focus:border-neutral-400 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-500">User</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-500">Test</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-500">Amount</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-500">Payment</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 animate-pulse">
                  {[...Array(5)].map((__, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-neutral-100 rounded w-24" /></td>)}
                </tr>
              ))}
              {!loading && filtered.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-neutral-900">{p.profiles?.full_name || '—'}</p>
                    <p className="text-xs text-neutral-500">{p.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">{p.rtr_tests?.title ?? p.test_id}</td>
                  <td className="px-6 py-4"><span className="text-sm font-black text-emerald-600">₹{p.amount}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${p.payment_id === 'simulated' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {p.payment_id === 'simulated' ? 'Simulated' : 'Paid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{new Date(p.purchased_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-neutral-500">No purchases found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
