'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { DgcaQuestion } from '@/lib/types';

interface ChapterCrumb {
  id: string;
  title: string;
  price: number;
  status: string;
  dgca_subjects?: { id: string; name: string; course_id: string; dgca_courses?: { id: string; name: string } | null } | null;
}

interface QForm {
  id?: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  image_url: string | null;
}

const EMPTY_Q: QForm = { question: '', options: ['', '', '', ''], correct: 0, explanation: '', image_url: null };

export default function AdminDGCAChapterQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [chapter, setChapter] = useState<ChapterCrumb | null>(null);
  const [questions, setQuestions] = useState<DgcaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<QForm>(EMPTY_Q);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/dgca/chapters/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const d = await res.json();
    setChapter(d.chapter ?? null);
    setQuestions(d.questions ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const openAdd = () => { setEditItem({ ...EMPTY_Q }); setShowModal(true); };
  const openEdit = (q: DgcaQuestion) => {
    setEditItem({ id: q.id, question: q.question, options: [...q.options], correct: q.correct, explanation: q.explanation ?? '', image_url: q.image_url ?? null });
    setShowModal(true);
  };

  const updateOption = (i: number, val: string) =>
    setEditItem((p) => ({ ...p, options: p.options.map((o, idx) => (idx === i ? val : o)) }));

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/dgca/upload?folder=questions', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok || !d.url) { alert(d.error ?? 'Upload failed'); return; }
      setEditItem((p) => ({ ...p, image_url: d.url }));
    } catch {
      alert('Image upload failed — check connection.');
    } finally { setImageUploading(false); }
  };

  const removeImage = () => {
    setEditItem((p) => ({ ...p, image_url: null }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const save = async () => {
    if (!editItem.question.trim()) { alert('Question is required'); return; }
    if (editItem.options.some((o) => !o.trim())) { alert('All options must be filled'); return; }
    if (imageUploading) { alert('Image is still uploading, please wait.'); return; }
    setSaving(true);
    try {
      const isEdit = !!editItem.id;
      const url = isEdit ? `/api/admin/dgca/questions/${editItem.id}` : '/api/admin/dgca/questions';
      const payload = { ...editItem, chapter_id: id };
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setShowModal(false); await fetchData(); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } finally { setSaving(false); }
  };

  const del = async (qid: string) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/admin/dgca/questions/${qid}`, { method: 'DELETE' });
    await fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (notFound || !chapter) return <div className="text-rose-600 py-20 text-center">Chapter not found. <Link href="/admin/dgca" className="underline">Back to DGCA</Link></div>;

  const courseName = chapter.dgca_subjects?.dgca_courses?.name;
  const subjectName = chapter.dgca_subjects?.name;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/dgca" className="text-neutral-500 hover:text-neutral-900 transition-colors">← DGCA</Link>
        <div>
          <h1 className="text-3xl font-black text-neutral-900">{chapter.title}</h1>
          <p className="text-neutral-500 text-sm">
            {[courseName, subjectName].filter(Boolean).join(' · ')} · {chapter.price === 0 ? 'Free' : `₹${chapter.price}`} · {chapter.status}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">{questions.length}</p><p className="text-sm text-neutral-500">Questions</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">{chapter.price === 0 ? 'Free' : `₹${chapter.price}`}</p><p className="text-sm text-neutral-500">Price</p></div>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors">+ Add MCQ</button>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start gap-4">
            <span className="text-neutral-400 font-black w-6 text-center shrink-0">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              {q.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.image_url} alt="diagram" className="h-16 w-auto mb-2 rounded-lg border border-neutral-200 object-contain" />
              )}
              <p className="text-sm text-neutral-900 font-medium mb-2">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i === q.correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                    {String.fromCharCode(65 + i)}: {opt.substring(0, 30)}{opt.length > 30 ? '…' : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(q)} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
              <button onClick={() => del(q.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <div className="text-center py-16 text-neutral-500">No questions yet. Add one, or bulk-upload from the DGCA page.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-2xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{editItem.id ? 'Edit' : 'New'} MCQ</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Question *</label>
                <textarea value={editItem.question} onChange={(e) => setEditItem((p) => ({ ...p, question: e.target.value }))} rows={3} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Question Image <span className="text-neutral-400 normal-case font-normal">(optional)</span></label>
                {editItem.image_url && (
                  <div className="relative mb-3 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editItem.image_url} alt="Preview" className="h-36 w-auto rounded-xl border border-neutral-200 object-contain" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-rose-700 leading-none">&times;</button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImage} className="text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200 file:cursor-pointer" />
                  {imageUploading && <span className="text-xs text-neutral-500 animate-pulse">Uploading…</span>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Options (select correct)</label>
                <div className="space-y-2">
                  {editItem.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="radio" name="dgca_correct" checked={editItem.correct === i} onChange={() => setEditItem((p) => ({ ...p, correct: i }))} className="w-4 h-4 accent-neutral-900 shrink-0" />
                      <span className="text-sm font-bold text-neutral-500 w-4">{String.fromCharCode(65 + i)}</span>
                      <input value={opt} onChange={(e) => updateOption(i, e.target.value)} className="flex-1 bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Explanation</label>
                <textarea value={editItem.explanation ?? ''} onChange={(e) => setEditItem((p) => ({ ...p, explanation: e.target.value }))} rows={2} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={save} disabled={saving || imageUploading} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
