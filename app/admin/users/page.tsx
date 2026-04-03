'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in: string | null;
  purchases: number;
  isAdmin: boolean;
  emailConfirmed: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: string, action: 'make_admin' | 'remove_admin' | 'delete') => {
    if (action === 'delete' && !confirm('Permanently delete this user and all their data?')) return;
    setActionLoading(userId + action);
    try {
      if (action === 'delete') {
        await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        await fetchUsers();
      } else {
        await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        await fetchUsers();
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Users</h1>
          <p className="text-neutral-400">{total} registered accounts</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2"/></svg>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full max-w-md bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-violet transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-400">User</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-400">Joined</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-400">Last Login</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-400">Purchases</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-400">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800 animate-pulse">
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-neutral-800 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              )}
              {!loading && users.map((user) => (
                <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/users/${user.id}`} className="group flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet/20 flex items-center justify-center text-violet font-bold text-sm flex-shrink-0">
                        {user.email?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-violet transition-colors">{user.full_name || '—'}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{new Date(user.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.purchases > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                      {user.purchases} {user.purchases === 1 ? 'purchase' : 'purchases'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.isAdmin && <span className="px-2 py-0.5 bg-violet/20 text-violet text-[10px] font-black rounded-full border border-violet/30">ADMIN</span>}
                      {user.emailConfirmed
                        ? <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full">VERIFIED</span>
                        : <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-black rounded-full">UNVERIFIED</span>
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/users/${user.id}`} className="text-xs text-neutral-400 hover:text-white transition-colors font-semibold">View</Link>
                      <button
                        onClick={() => handleAction(user.id, user.isAdmin ? 'remove_admin' : 'make_admin')}
                        disabled={actionLoading === user.id + (user.isAdmin ? 'remove_admin' : 'make_admin')}
                        className="text-xs text-violet hover:text-violet-300 transition-colors font-semibold disabled:opacity-50"
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleAction(user.id, 'delete')}
                        disabled={actionLoading === user.id + 'delete'}
                        className="text-xs text-rose-500 hover:text-rose-400 transition-colors font-semibold disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-neutral-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between">
          <p className="text-sm text-neutral-400">Showing page {page}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-neutral-800 text-white rounded-lg disabled:opacity-40 hover:bg-neutral-700 transition-colors">← Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20} className="px-3 py-1.5 text-sm bg-neutral-800 text-white rounded-lg disabled:opacity-40 hover:bg-neutral-700 transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
