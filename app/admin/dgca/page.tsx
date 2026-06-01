'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { DgcaCourse, DgcaSubject, DgcaChapter } from '@/lib/types';

// ── CSV helpers (shared shape with the RTR bulk uploader) ──
interface BulkRow { question: string; options: string[]; correct: number; explanation: string }

const CSV_TEMPLATE = `question,option_a,option_b,option_c,option_d,correct_answer,explanation
"What is the standard ISA pressure at sea level?","1003 hPa","1013.25 hPa","1023 hPa","1000 hPa","B","Standard ISA sea-level pressure is 1013.25 hPa."
"VFR minimum visibility in controlled airspace is generally?","1 km","3 km","5 km","8 km","C","Most controlled airspace requires 5 km visibility for VFR."`;

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) { cols.push(current); current = ''; }
    else { current += c; }
  }
  cols.push(current);
  return cols;
}

function parseCSV(text: string): { rows: BulkRow[]; errors: string[] } {
  const lines = text.trim().split('\n');
  const errors: string[] = [];
  const rows: BulkRow[] = [];
  if (lines.length < 2) return { rows: [], errors: ['CSV must have a header row and at least one data row'] };
  const letterIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 6) { errors.push(`Row ${i + 1}: expected 6+ columns`); continue; }
    const [question, a, b, c, d, correct_letter, explanation = ''] = cols.map((x) => x.trim());
    if (!question) { errors.push(`Row ${i + 1}: question is empty`); continue; }
    const options = [a, b, c, d];
    if (options.some((o) => !o)) { errors.push(`Row ${i + 1}: all four options must be filled`); continue; }
    const correct = letterIdx[correct_letter.toUpperCase()];
    if (correct === undefined) { errors.push(`Row ${i + 1}: correct_answer must be A, B, C, or D`); continue; }
    rows.push({ question, options, correct, explanation });
  }
  return { rows, errors };
}

export default function AdminDGCAPage() {
  const [courses, setCourses] = useState<DgcaCourse[]>([]);
  const [subjects, setSubjects] = useState<DgcaSubject[]>([]);
  const [chapters, setChapters] = useState<DgcaChapter[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state for add/edit of each level.
  const [modal, setModal] = useState<null | { kind: 'course' | 'subject' | 'chapter'; edit?: DgcaCourse | DgcaSubject | DgcaChapter }>(null);
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [saving, setSaving] = useState(false);

  // Bulk upload state
  const [bulkParsed, setBulkParsed] = useState<BulkRow[] | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ inserted: number; errors?: string[] } | null>(null);

  const fetchCourses = useCallback(async () => {
    const res = await fetch('/api/admin/dgca/courses');
    const d = await res.json();
    setCourses(d.courses ?? []);
    setLoading(false);
  }, []);

  const fetchSubjects = useCallback(async (cid: string) => {
    const res = await fetch(`/api/admin/dgca/subjects?courseId=${encodeURIComponent(cid)}`);
    const d = await res.json();
    setSubjects(d.subjects ?? []);
  }, []);

  const fetchChapters = useCallback(async (sid: string) => {
    const res = await fetch(`/api/admin/dgca/chapters?subjectId=${encodeURIComponent(sid)}`);
    const d = await res.json();
    setChapters(d.chapters ?? []);
  }, []);

  useEffect(() => { void fetchCourses(); }, [fetchCourses]);
  useEffect(() => { if (courseId) void fetchSubjects(courseId); else setSubjects([]); }, [courseId, fetchSubjects]);
  useEffect(() => { if (subjectId) void fetchChapters(subjectId); else setChapters([]); }, [subjectId, fetchChapters]);

  const selectCourse = (id: string) => { setCourseId(id); setSubjectId(null); setChapterId(null); };
  const selectSubject = (id: string) => { setSubjectId(id); setChapterId(null); };

  const selectedChapter = chapters.find((c) => c.id === chapterId) ?? null;

  // ── Save (create or update) for the active modal ──
  const openModal = (kind: 'course' | 'subject' | 'chapter', edit?: DgcaCourse | DgcaSubject | DgcaChapter) => {
    if (kind === 'course') setForm(edit ? { name: (edit as DgcaCourse).name, sort_order: (edit as DgcaCourse).sort_order } : { name: '', sort_order: courses.length + 1 });
    if (kind === 'subject') setForm(edit ? { name: (edit as DgcaSubject).name, sort_order: (edit as DgcaSubject).sort_order } : { name: '', sort_order: subjects.length + 1 });
    if (kind === 'chapter') setForm(edit
      ? { title: (edit as DgcaChapter).title, description: (edit as DgcaChapter).description ?? '', price: (edit as DgcaChapter).price, status: (edit as DgcaChapter).status, sort_order: (edit as DgcaChapter).sort_order }
      : { title: '', description: '', price: 0, status: 'active', sort_order: chapters.length + 1 });
    setModal({ kind, edit });
  };

  const saveModal = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const { kind, edit } = modal;
      let url = '';
      let payload: Record<string, unknown> = {};
      if (kind === 'course') {
        url = edit ? `/api/admin/dgca/courses/${edit.id}` : '/api/admin/dgca/courses';
        payload = { name: form.name, sort_order: form.sort_order };
      } else if (kind === 'subject') {
        if (!courseId) { alert('Select a course first'); setSaving(false); return; }
        url = edit ? `/api/admin/dgca/subjects/${edit.id}` : '/api/admin/dgca/subjects';
        payload = { course_id: courseId, name: form.name, sort_order: form.sort_order };
      } else {
        if (!subjectId) { alert('Select a subject first'); setSaving(false); return; }
        url = edit ? `/api/admin/dgca/chapters/${edit.id}` : '/api/admin/dgca/chapters';
        payload = { subject_id: subjectId, title: form.title, description: form.description, price: form.price, status: form.status, sort_order: form.sort_order };
      }
      const res = await fetch(url, { method: edit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Save failed'); return; }
      setModal(null);
      if (kind === 'course') await fetchCourses();
      else if (kind === 'subject' && courseId) await fetchSubjects(courseId);
      else if (kind === 'chapter' && subjectId) await fetchChapters(subjectId);
    } finally { setSaving(false); }
  };

  const del = async (kind: 'course' | 'subject' | 'chapter', id: string) => {
    const label = kind === 'course' ? 'course (and all its subjects, chapters & questions)' : kind === 'subject' ? 'subject (and all its chapters & questions)' : 'chapter (and all its questions)';
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    await fetch(`/api/admin/dgca/${kind === 'course' ? 'courses' : kind === 'subject' ? 'subjects' : 'chapters'}/${id}`, { method: 'DELETE' });
    if (kind === 'course') { if (courseId === id) setCourseId(null); await fetchCourses(); }
    else if (kind === 'subject') { if (subjectId === id) setSubjectId(null); if (courseId) await fetchSubjects(courseId); }
    else { if (chapterId === id) setChapterId(null); if (subjectId) await fetchChapters(subjectId); }
  };

  // ── Bulk upload ──
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dgca-mcq-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows, errors } = parseCSV(ev.target?.result as string);
      setBulkParsed(rows);
      setBulkErrors(errors);
    };
    reader.readAsText(file);
  };

  const submitBulk = async () => {
    if (!chapterId || !bulkParsed || bulkParsed.length === 0) return;
    setBulkUploading(true);
    try {
      const res = await fetch('/api/admin/dgca/questions/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter_id: chapterId, questions: bulkParsed }),
      });
      const d = await res.json();
      // The bulk route reports guard/validation failures as `{ error: string }`
      // (no inserted/errors keys). Normalise so the result box always has a message.
      setBulkResult(res.ok ? d : { inserted: d.inserted ?? 0, errors: d.errors ?? (d.error ? [d.error] : ['Upload failed']) });
      if (res.ok) { setBulkParsed(null); setBulkErrors([]); if (subjectId) await fetchChapters(subjectId); }
    } catch {
      setBulkResult({ inserted: 0, errors: ['Network error'] });
    } finally { setBulkUploading(false); }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900 mb-1">DGCA Practice</h1>
        <p className="text-neutral-500">Manage CPL / ATPL courses, subjects, chapters, pricing and MCQs.</p>
      </div>

      {/* Cascading selector — Course → Subject → Chapter (mirrors the planning sketch) */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Column
          title="Course"
          onAdd={() => openModal('course')}
          loading={loading}
          items={courses.map((c) => ({ id: c.id, label: c.name, meta: `#${c.sort_order}` }))}
          selectedId={courseId}
          onSelect={selectCourse}
          onEdit={(id) => { const c = courses.find((x) => x.id === id); if (c) openModal('course', c); }}
          onDelete={(id) => del('course', id)}
          empty="No courses yet."
        />
        <Column
          title="Subject"
          onAdd={courseId ? () => openModal('subject') : undefined}
          items={subjects.map((s) => ({ id: s.id, label: s.name, meta: `#${s.sort_order}` }))}
          selectedId={subjectId}
          onSelect={selectSubject}
          onEdit={(id) => { const s = subjects.find((x) => x.id === id); if (s) openModal('subject', s); }}
          onDelete={(id) => del('subject', id)}
          empty={courseId ? 'No subjects yet.' : 'Select a course.'}
        />
        <Column
          title="Chapter"
          onAdd={subjectId ? () => openModal('chapter') : undefined}
          items={chapters.map((c) => ({
            id: c.id,
            label: c.title,
            meta: `${c.price === 0 ? 'Free' : `₹${c.price}`} · ${c.question_count ?? 0} Qs${c.status === 'inactive' ? ' · hidden' : ''}`,
          }))}
          selectedId={chapterId}
          onSelect={setChapterId}
          onEdit={(id) => { const c = chapters.find((x) => x.id === id); if (c) openModal('chapter', c); }}
          onDelete={(id) => del('chapter', id)}
          empty={subjectId ? 'No chapters yet. Create one.' : 'Select a subject.'}
        />
      </div>

      {/* Chapter detail + bulk upload */}
      {selectedChapter ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-neutral-900">{selectedChapter.title}</h2>
              <p className="text-sm text-neutral-500 mt-1">
                {selectedChapter.price === 0 ? 'Free' : `₹${selectedChapter.price}`} · {selectedChapter.question_count ?? 0} questions · {selectedChapter.status}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openModal('chapter', selectedChapter)} className="px-4 py-2 bg-neutral-100 text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-200 transition-colors">Edit chapter</button>
              <Link href={`/admin/dgca/chapters/${selectedChapter.id}`} className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors">Manage Questions →</Link>
            </div>
          </div>

          {/* Bulk MCQ upload */}
          <div className="border-t border-neutral-200 pt-6">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3">Bulk Upload MCQs</h3>
            <div className="mb-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 mb-1">
                Columns: <code className="bg-neutral-200 px-1.5 py-0.5 rounded font-mono">question, option_a, option_b, option_c, option_d, correct_answer, explanation</code>
              </p>
              <p className="text-xs text-neutral-500 mb-3"><strong>correct_answer</strong> must be A, B, C, or D. Wrap text containing commas in double quotes.</p>
              <button onClick={downloadTemplate} className="text-xs px-3 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800">↓ Download Template CSV</button>
            </div>

            <input
              type="file" accept=".csv,text/csv" onChange={handleBulkCSV}
              className="text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200 file:cursor-pointer mb-4"
            />

            {bulkErrors.length > 0 && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-xs font-bold text-rose-700 mb-2">Parsing errors ({bulkErrors.length})</p>
                <ul className="space-y-1">
                  {bulkErrors.slice(0, 6).map((e, i) => <li key={i} className="text-xs text-rose-600">{e}</li>)}
                  {bulkErrors.length > 6 && <li className="text-xs text-rose-400">…and {bulkErrors.length - 6} more</li>}
                </ul>
              </div>
            )}

            {bulkParsed && bulkParsed.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-neutral-700 mb-3">{bulkParsed.length} question{bulkParsed.length !== 1 ? 's' : ''} ready</p>
                <div className="max-h-56 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                  {bulkParsed.map((q, i) => (
                    <div key={i} className="p-3 text-xs">
                      <p className="font-medium text-neutral-900 mb-1">{i + 1}. {q.question}</p>
                      <div className="flex flex-wrap gap-1">
                        {q.options.map((opt, j) => (
                          <span key={j} className={`px-2 py-0.5 rounded border ${j === q.correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                            {String.fromCharCode(65 + j)}: {opt.substring(0, 28)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkResult && (
              <div className={`mb-4 p-4 rounded-xl border ${bulkResult.inserted > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                {bulkResult.inserted > 0 && <p className="text-sm font-bold text-emerald-700">✓ {bulkResult.inserted} question{bulkResult.inserted !== 1 ? 's' : ''} imported</p>}
                {bulkResult.errors && bulkResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">{bulkResult.errors.map((e, i) => <li key={i} className="text-xs text-rose-600">{e}</li>)}</ul>
                )}
              </div>
            )}

            <button
              onClick={submitBulk}
              disabled={!bulkParsed || bulkParsed.length === 0 || bulkUploading}
              className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50"
            >
              {bulkUploading ? 'Importing…' : `Import ${bulkParsed?.length ?? 0} MCQ${(bulkParsed?.length ?? 0) !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-neutral-300 rounded-2xl py-16 text-center text-neutral-500">
          Select a chapter to upload MCQs, or create a new one.
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{modal.edit ? 'Edit' : 'New'} {modal.kind}</h2>
              <button onClick={() => setModal(null)} className="text-neutral-400 hover:text-neutral-900 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              {modal.kind === 'chapter' ? (
                <>
                  <Field label="Title *"><input value={String(form.title ?? '')} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Description"><textarea value={String(form.description ?? '')} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} /></Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Price (₹) — 0 = Free"><input type="number" min={0} value={Number(form.price ?? 0)} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className={inputCls} /></Field>
                    <Field label="Status">
                      <select value={String(form.status ?? 'active')} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
                        <option value="active">Active (visible)</option>
                        <option value="inactive">Inactive (hidden)</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Sort order"><input type="number" value={Number(form.sort_order ?? 0)} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} className={inputCls} /></Field>
                </>
              ) : (
                <>
                  <Field label="Name *"><input value={String(form.name ?? '')} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Sort order"><input type="number" value={Number(form.sort_order ?? 0)} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} className={inputCls} /></Field>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={saveModal} disabled={saving} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setModal(null)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">Cancel</button>
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

interface ColItem { id: string; label: string; meta?: string }
function Column({ title, items, selectedId, onSelect, onAdd, onEdit, onDelete, empty, loading }: {
  title: string;
  items: ColItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  empty: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl flex flex-col min-h-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">{title}</p>
        {onAdd && <button onClick={onAdd} className="text-xs font-bold px-2.5 py-1 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800">+ Add</button>}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-12 bg-neutral-100 rounded-xl animate-pulse" />)
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-10">{empty}</p>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${selectedId === it.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-800'}`}
              onClick={() => onSelect(it.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{it.label}</p>
                {it.meta && <p className={`text-[11px] truncate ${selectedId === it.id ? 'text-white/60' : 'text-neutral-400'}`}>{it.meta}</p>}
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onEdit(it.id); }} className={`text-xs font-semibold ${selectedId === it.id ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>Edit</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(it.id); }} className="text-xs font-semibold text-rose-400 hover:text-rose-500">Del</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
