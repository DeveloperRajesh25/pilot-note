'use client';

import { useState, useEffect, useCallback } from 'react';

interface Guide {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  read_time: string;
  difficulty: string;
  published: boolean;
}

const EMPTY_GUIDE: Partial<Guide> = { title: '', category: 'Career Path', summary: '', content: '', read_time: '5 min read', difficulty: 'Beginner', published: true };
const CATEGORIES = ['Career Path', 'Exam Prep', 'Medical', 'Training', 'Other'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGuide, setEditGuide] = useState<Partial<Guide>>(EMPTY_GUIDE);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/guides');
    const data = await res.json();
    setGuides(data.guides ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGuides(); }, [fetchGuides]);

  const openCreate = () => { setEditGuide(EMPTY_GUIDE); setShowModal(true); };
  const openEdit = (g: Guide) => { setEditGuide({ ...g }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEdit = !!(editGuide as Guide).id && (editGuide as Guide).id && !String((editGuide as any).id).startsWith('new');
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/admin/guides/${(editGuide as Guide).id}` : '/api/admin/guides';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editGuide) });
      if (res.ok) { setShowModal(false); await fetchGuides(); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this guide?')) return;
    setDeleteLoading(id);
    await fetch(`/api/admin/guides/${id}`, { method: 'DELETE' });
    setDeleteLoading(null);
    await fetchGuides();
  };

  const togglePublish = async (g: Guide) => {
    await fetch(`/api/admin/guides/${g.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !g.published }),
    });
    await fetchGuides();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Guides</h1>
          <p className="text-neutral-400">{guides.length} guides total</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-violet text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-2">
          <span className="text-lg leading-none">+</span> New Guide
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-neutral-900 rounded-2xl border border-neutral-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((g) => (
            <div key={g.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex items-center gap-4 hover:border-neutral-700 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-violet uppercase tracking-wider">{g.category}</span>
                  <span className="text-neutral-700">·</span>
                  <span className="text-xs text-neutral-500">{g.difficulty}</span>
                  <span className="text-neutral-700">·</span>
                  <span className="text-xs text-neutral-500">{g.read_time}</span>
                </div>
                <p className="font-bold text-white text-sm truncate">{g.title}</p>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{g.summary}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => togglePublish(g)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${g.published ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                >
                  {g.published ? '✓ Published' : 'Draft'}
                </button>
                <button onClick={() => openEdit(g)} className="text-xs text-neutral-400 hover:text-white transition-colors font-semibold">Edit</button>
                <button onClick={() => handleDelete(g.id)} disabled={deleteLoading === g.id} className="text-xs text-rose-500 hover:text-rose-400 transition-colors font-semibold disabled:opacity-50">Delete</button>
              </div>
            </div>
          ))}
          {guides.length === 0 && <div className="text-center py-20 text-neutral-500">No guides yet. Create your first guide.</div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-3xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">{(editGuide as Guide).id ? 'Edit Guide' : 'New Guide'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Title *</label>
                <input value={editGuide.title || ''} onChange={e => setEditGuide(p => ({ ...p, title: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Category</label>
                  <select value={editGuide.category || 'Career Path'} onChange={e => setEditGuide(p => ({ ...p, category: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Difficulty</label>
                  <select value={editGuide.difficulty || 'Beginner'} onChange={e => setEditGuide(p => ({ ...p, difficulty: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors">
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Read Time</label>
                  <input value={editGuide.read_time || ''} onChange={e => setEditGuide(p => ({ ...p, read_time: e.target.value }))} placeholder="e.g. 8 min read" className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Summary</label>
                <textarea value={editGuide.summary || ''} onChange={e => setEditGuide(p => ({ ...p, summary: e.target.value }))} rows={2} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Content (HTML)</label>
                <textarea value={editGuide.content || ''} onChange={e => setEditGuide(p => ({ ...p, content: e.target.value }))} rows={10} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors resize-y font-mono text-xs" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pub" checked={!!editGuide.published} onChange={e => setEditGuide(p => ({ ...p, published: e.target.checked }))} className="w-4 h-4 accent-violet" />
                <label htmlFor="pub" className="text-sm text-neutral-300 font-medium">Published (visible to users)</label>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-800">
              <button onClick={handleSave} disabled={saving || !editGuide.title} className="px-6 py-3 bg-violet text-white font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Guide'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-700 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
