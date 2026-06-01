'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParikshaTopper } from '@/lib/types';

interface TForm {
  id?: string;
  rank: number;
  student_name: string;
  subject: string;
  marks: string;
  total_marks: string;
  photo_url: string | null;
  exam_label: string;
  published: boolean;
}

const EMPTY: TForm = { rank: 1, student_name: '', subject: '', marks: '', total_marks: '', photo_url: null, exam_label: '', published: true };

export default function AdminLeaderboardPage() {
  const [toppers, setToppers] = useState<ParikshaTopper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/leaderboard');
    const d = await res.json();
    setToppers(d.toppers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const openAdd = () => { setForm({ ...EMPTY, rank: toppers.length + 1 }); setShowModal(true); };
  const openEdit = (t: ParikshaTopper) => {
    setForm({
      id: t.id, rank: t.rank, student_name: t.student_name, subject: t.subject ?? '',
      marks: t.marks?.toString() ?? '', total_marks: t.total_marks?.toString() ?? '',
      photo_url: t.photo_url, exam_label: t.exam_label ?? '', published: t.published,
    });
    setShowModal(true);
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/dgca/upload?folder=toppers', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok || !d.url) { alert(d.error ?? 'Upload failed'); return; }
      setForm((f) => ({ ...f, photo_url: d.url }));
    } catch {
      alert('Photo upload failed.');
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.student_name.trim()) { alert('Student name is required'); return; }
    if (uploading) { alert('Photo is still uploading, please wait.'); return; }
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const url = isEdit ? `/api/admin/leaderboard/${form.id}` : '/api/admin/leaderboard';
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setShowModal(false); await fetchData(); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Remove this topper from the leaderboard?')) return;
    await fetch(`/api/admin/leaderboard/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const togglePublish = async (t: ParikshaTopper) => {
    await fetch(`/api/admin/leaderboard/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !t.published }) });
    await fetchData();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">Pariksha Toppers</h1>
          <p className="text-neutral-500">{toppers.length} entries · published ones show on the Pariksha page (Top 10).</p>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 bg-neutral-900 text-white font-bold text-sm rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2"><span>+</span> Add Topper</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-neutral-100 rounded-2xl border border-neutral-200 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {toppers.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4 hover:border-neutral-300 transition-all">
              <span className="font-black text-2xl text-neutral-300 w-10 text-center shrink-0">{t.rank}</span>
              {t.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photo_url} alt={t.student_name} className="w-12 h-12 rounded-full object-cover border border-neutral-200 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-black shrink-0">{t.student_name.charAt(0).toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-neutral-900 truncate">{t.student_name}</p>
                  {!t.published && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">Draft</span>}
                </div>
                <p className="text-sm text-neutral-500">
                  {[t.subject, t.exam_label].filter(Boolean).join(' · ') || '—'}
                  {t.marks != null && <span className="ml-2 font-semibold text-neutral-700">{t.marks}{t.total_marks ? `/${t.total_marks}` : ''} marks</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => togglePublish(t)} className="text-sm text-amber-700 hover:text-amber-800 font-semibold">{t.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => openEdit(t)} className="text-sm text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
                <button onClick={() => del(t.id)} className="text-sm text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
              </div>
            </div>
          ))}
          {toppers.length === 0 && <div className="text-center py-24 text-neutral-500">No toppers yet. Add the first one.</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-lg my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{form.id ? 'Edit' : 'New'} Topper</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {form.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.photo_url} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-neutral-200" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs">Photo</div>
                )}
                <div className="flex items-center gap-3">
                  <input ref={photoRef} type="file" accept="image/*" onChange={uploadPhoto} className="text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200 file:cursor-pointer" />
                  {uploading && <span className="text-xs text-neutral-500 animate-pulse">Uploading…</span>}
                  {form.photo_url && <button type="button" onClick={() => { setForm((f) => ({ ...f, photo_url: null })); if (photoRef.current) photoRef.current.value = ''; }} className="text-xs text-rose-600 font-semibold">Remove</button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rank *"><input type="number" min={1} value={form.rank} onChange={(e) => setForm((f) => ({ ...f, rank: Number(e.target.value) }))} className={inputCls} /></Field>
                <Field label="Student Name *"><input value={form.student_name} onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))} className={inputCls} /></Field>
              </div>
              <Field label="Subject"><input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className={inputCls} placeholder="e.g. Air Navigation" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marks"><input type="number" value={form.marks} onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))} className={inputCls} /></Field>
                <Field label="Out of"><input type="number" value={form.total_marks} onChange={(e) => setForm((f) => ({ ...f, total_marks: e.target.value }))} className={inputCls} placeholder="100" /></Field>
              </div>
              <Field label="Exam label"><input value={form.exam_label} onChange={(e) => setForm((f) => ({ ...f, exam_label: e.target.value }))} className={inputCls} placeholder="e.g. All India Air Nav Mock" /></Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="w-4 h-4 accent-neutral-900" />
                <span className="text-sm font-semibold text-neutral-700">Published (visible on Pariksha page)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={save} disabled={saving || uploading} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">{label}</label>
      {children}
    </div>
  );
}
