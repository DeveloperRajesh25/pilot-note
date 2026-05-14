'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface RTRTest {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
}

export default function AdminRTRPage() {
  const [tests, setTests] = useState<RTRTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTest, setEditTest] = useState<Partial<RTRTest>>({ title: '', description: '', price: 299, status: 'active' });
  const [saving, setSaving] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/rtr/tests');
    const data = await res.json();
    setTests(data.tests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const handleSave = async () => {
    if (!editTest.title) { alert('Title is required'); return; }
    setSaving(true);
    try {
      const isEdit = !!(editTest as RTRTest).id;
      const url = isEdit ? `/api/admin/rtr/tests/${(editTest as RTRTest).id}` : '/api/admin/rtr/tests';
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editTest) });
      if (res.ok) { setShowModal(false); await fetchTests(); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this RTR test? This will remove all associated questions and scenarios.')) return;
    await fetch(`/api/admin/rtr/tests/${id}`, { method: 'DELETE' });
    await fetchTests();
  };

  const toggleStatus = async (t: RTRTest) => {
    await fetch(`/api/admin/rtr/tests/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: t.status === 'active' ? 'inactive' : 'active' }),
    });
    await fetchTests();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">RTR Tests</h1>
          <p className="text-neutral-500">{tests.length} tests</p>
        </div>
        <button onClick={() => { setEditTest({ title: '', description: '', price: 299, status: 'active' }); setShowModal(true); }}
          className="px-5 py-2.5 bg-neutral-900 text-white font-bold text-sm rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2">
          <span>+</span> New RTR Test
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-neutral-100 rounded-2xl border border-neutral-200 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {tests.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-black text-neutral-900">{t.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${t.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{t.status}</span>
                  </div>
                  <p className="text-neutral-500 text-sm mb-4">{t.description}</p>
                  <p className="text-lg font-black text-neutral-900">₹{t.price}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link href={`/admin/rtr/${t.id}`} className="px-4 py-2 bg-neutral-100 text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-200 transition-colors">
                    Manage Questions →
                  </Link>
                  <button onClick={() => { setEditTest({ ...t }); setShowModal(true); }} className="text-sm text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
                  <button onClick={() => toggleStatus(t)} className="text-sm text-amber-700 hover:text-amber-800 font-semibold">{t.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => handleDelete(t.id)} className="text-sm text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {tests.length === 0 && <div className="text-center py-24 text-neutral-500">No RTR tests yet.</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{(editTest as RTRTest).id ? 'Edit RTR Test' : 'New RTR Test'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Title *</label>
                <input value={editTest.title || ''} onChange={e => setEditTest(p => ({ ...p, title: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Description</label>
                <textarea value={editTest.description || ''} onChange={e => setEditTest(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Price (₹)</label>
                  <input type="number" value={editTest.price || 299} onChange={e => setEditTest(p => ({ ...p, price: Number(e.target.value) }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Status</label>
                  <select value={editTest.status || 'active'} onChange={e => setEditTest(p => ({ ...p, status: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save Test'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
