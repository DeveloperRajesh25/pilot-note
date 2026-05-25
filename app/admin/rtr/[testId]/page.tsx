'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type {
  RTRTest,
  RTRPart1Question,
  RTRPart2Scenario,
  RTRChartContext,
  RTRChartQuestion,
  RTRSubPart,
  RTRBlank,
} from '@/lib/types';

interface QForm {
  id?: string;
  test_id?: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  image_url?: string | null;
  pdf_url?: string | null;
}

interface BulkRow {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const CSV_TEMPLATE = `question,option_a,option_b,option_c,option_d,correct_answer,explanation
"What is the minimum VFR visibility?","1 km","3 km","5 km","8 km","C","VFR requires 5 km visibility in most airspace"
"ATC stands for?","Air Traffic Control","Altitude Transfer Check","Air Terrain Clearance","Auto Taxi Control","A","ATC = Air Traffic Control"`;

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += c;
    }
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
    if (cols.length < 6) {
      errors.push(`Row ${i + 1}: expected 6+ columns (question, option_a, b, c, d, correct_answer, [explanation])`);
      continue;
    }
    const [question, opt_a, opt_b, opt_c, opt_d, correct_letter, explanation = ''] = cols.map(c => c.trim());
    if (!question) { errors.push(`Row ${i + 1}: question is empty`); continue; }
    const options = [opt_a, opt_b, opt_c, opt_d];
    if (options.some(o => !o)) { errors.push(`Row ${i + 1}: all four options must be filled`); continue; }
    const correct = letterIdx[correct_letter.toUpperCase()];
    if (correct === undefined) { errors.push(`Row ${i + 1}: correct_answer must be A, B, C, or D`); continue; }
    rows.push({ question, options, correct, explanation });
  }
  return { rows, errors };
}

interface SForm {
  id?: string;
  test_id?: string;
  scenario: string;
  instruction: string | null;
  marks: number;
  chart_context: RTRChartContext;
  questions: RTRChartQuestion[];
}

type EditItem = QForm | SForm;

interface RTRDetail {
  test: RTRTest | null;
  questions: RTRPart1Question[];
  scenarios: RTRPart2Scenario[];
}

const EMPTY_Q: QForm = { question: '', options: ['', '', '', ''], correct: 0, explanation: '', image_url: null, pdf_url: null };

const EMPTY_CHART: RTRChartContext = {
  time_allowed: '25 minutes',
  total_marks: 100,
  aircraft_id: '',
  type_aircraft: '',
  flight_rules: '',
  wake_turb_cat: '',
  flight_type: '',
  equipment: '',
  departure: '',
  time: '',
  level: '',
  route: '',
  destination: '',
  alternate: '',
  other_info: '',
};

const EMPTY_S: SForm = {
  scenario: '',
  instruction: '',
  marks: 100,
  chart_context: { ...EMPTY_CHART },
  questions: [{ number: 1, subParts: [{ label: 'a', prompt: '', expectedAnswer: '', marks: 10 }] }],
};

function isQForm(item: EditItem): item is QForm {
  return Object.prototype.hasOwnProperty.call(item, 'options');
}

// Fixed labels rendered in the same order on every chart, matching the printed paper.
const CHART_FIELDS: { key: keyof RTRChartContext; label: string }[] = [
  { key: 'aircraft_id', label: 'Aircraft Identification' },
  { key: 'flight_rules', label: 'Flight Rules' },
  { key: 'flight_type', label: 'Type of Flight' },
  { key: 'type_aircraft', label: 'Type of Aircraft' },
  { key: 'wake_turb_cat', label: 'Wake Turbulence CAT' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'departure', label: 'Departure Aerodrome' },
  { key: 'time', label: 'Time' },
  { key: 'level', label: 'Level' },
  { key: 'route', label: 'Route' },
  { key: 'destination', label: 'Destination Aerodrome' },
  { key: 'alternate', label: 'Alternate Aerodrome' },
  { key: 'other_info', label: 'Other Information' },
];

export default function AdminRTRTestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const [data, setData] = useState<RTRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'part1' | 'part2'>('part1');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'q' | 's'>('q');
  const [editItem, setEditItem] = useState<EditItem>(EMPTY_Q);
  const [saving, setSaving] = useState(false);

  // Attachment upload state (Part 1 MCQ — image or PDF per question)
  const [imageUploading, setImageUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Bulk upload state (Part 1 MCQ only)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkParsed, setBulkParsed] = useState<BulkRow[] | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ inserted: number; errors?: string[] } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/rtr/tests/${testId}`);
    const d: RTRDetail = await res.json();
    setData(d);
    setLoading(false);
  }, [testId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const openAddQ = () => {
    setEditItem({ ...EMPTY_Q, test_id: testId });
    setImagePreviewUrl(null);
    setModalType('q');
    setShowModal(true);
  };
  const openEditQ = (q: RTRPart1Question) => {
    setEditItem({ ...q, options: [...q.options], image_url: q.image_url ?? null, pdf_url: q.pdf_url ?? null });
    setImagePreviewUrl(q.image_url ?? null);
    setModalType('q');
    setShowModal(true);
  };

  const uploadAttachment = async (file: File): Promise<{ url: string; kind: 'image' | 'pdf' } | null> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/rtr/questions/upload-attachment', { method: 'POST', body: formData });
    const d = await res.json();
    if (!res.ok || !d.url) { alert(d.error ?? 'Upload failed'); return null; }
    return { url: d.url, kind: d.kind };
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setImageUploading(true);
    try {
      const result = await uploadAttachment(file);
      if (result && result.kind === 'image') {
        setEditItem(p => isQForm(p) ? { ...p, image_url: result.url } : p);
      }
    } catch {
      alert('Image upload failed — check network connection');
    } finally {
      setImageUploading(false);
    }
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    try {
      const result = await uploadAttachment(file);
      if (result && result.kind === 'pdf') {
        setEditItem(p => isQForm(p) ? { ...p, pdf_url: result.url } : p);
      }
    } catch {
      alert('PDF upload failed — check network connection');
    } finally {
      setPdfUploading(false);
    }
  };

  const removeImage = () => {
    setEditItem(p => isQForm(p) ? { ...p, image_url: null } : p);
    setImagePreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removePdf = () => {
    setEditItem(p => isQForm(p) ? { ...p, pdf_url: null } : p);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };
  const openAddS = () => {
    setEditItem({
      ...EMPTY_S,
      test_id: testId,
      chart_context: { ...EMPTY_CHART },
      questions: [{ number: 1, subParts: [{ label: 'a', prompt: '', expectedAnswer: '', marks: 10 }] }],
    });
    setModalType('s');
    setShowModal(true);
  };
  const openEditS = (s: RTRPart2Scenario) => {
    setEditItem({
      id: s.id,
      test_id: s.test_id,
      scenario: s.scenario,
      instruction: s.instruction,
      marks: s.marks,
      chart_context: { ...EMPTY_CHART, ...(s.chart_context ?? {}) },
      questions: s.questions ?? [{ number: 1, subParts: [{ label: 'a', prompt: '', expectedAnswer: '', marks: 10 }] }],
    });
    setModalType('s');
    setShowModal(true);
  };

  const handleSaveQ = async () => {
    if (!isQForm(editItem)) return;
    if (imageUploading || pdfUploading) { alert('An attachment is still uploading, please wait.'); return; }
    const isEdit = !!editItem.id;
    const url = isEdit ? `/api/admin/rtr/questions/${editItem.id}` : '/api/admin/rtr/questions';
    setSaving(true);
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) });
    setSaving(false);
    if (res.ok) { setShowModal(false); await fetchData(); }
    else { const d = await res.json(); alert(d.error || 'Save failed'); }
  };

  const handleSaveS = async () => {
    if (isQForm(editItem)) return;
    if (!editItem.scenario.trim()) { alert('Chart title is required'); return; }
    if (editItem.questions.length === 0) { alert('Add at least one question'); return; }
    const payload = { ...editItem };
    const isEdit = !!editItem.id;
    const url = isEdit ? `/api/admin/rtr/scenarios/${editItem.id}` : '/api/admin/rtr/scenarios';
    setSaving(true);
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setShowModal(false); await fetchData(); }
    else { const d = await res.json(); alert(d.error || 'Save failed'); }
  };

  const deleteQ = async (id: string) => {
    if (!confirm('Delete question?')) return;
    await fetch(`/api/admin/rtr/questions/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const deleteS = async (id: string) => {
    if (!confirm('Delete chart scenario?')) return;
    await fetch(`/api/admin/rtr/scenarios/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const updateOption = (i: number, val: string) => {
    setEditItem(prev => {
      if (!isQForm(prev)) return prev;
      const opts = [...prev.options];
      opts[i] = val;
      return { ...prev, options: opts };
    });
  };

  // --- Scenario form helpers ---

  const setChartField = (key: keyof RTRChartContext, val: string | number) => {
    setEditItem(prev => {
      if (isQForm(prev)) return prev;
      return { ...prev, chart_context: { ...prev.chart_context, [key]: val } };
    });
  };

  const updateQuestion = (qi: number, mut: (q: RTRChartQuestion) => RTRChartQuestion) => {
    setEditItem(prev => {
      if (isQForm(prev)) return prev;
      const questions = prev.questions.map((q, i) => (i === qi ? mut(q) : q));
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    setEditItem(prev => {
      if (isQForm(prev)) return prev;
      const nextNumber = (prev.questions[prev.questions.length - 1]?.number ?? 0) + 1;
      return {
        ...prev,
        questions: [...prev.questions, { number: nextNumber, subParts: [{ label: 'a', prompt: '', expectedAnswer: '', marks: 10 }] }],
      };
    });
  };

  const removeQuestion = (qi: number) => {
    setEditItem(prev => {
      if (isQForm(prev)) return prev;
      return { ...prev, questions: prev.questions.filter((_, i) => i !== qi) };
    });
  };

  const updateSubPart = (qi: number, si: number, mut: (s: RTRSubPart) => RTRSubPart) => {
    updateQuestion(qi, q => ({ ...q, subParts: q.subParts.map((s, i) => (i === si ? mut(s) : s)) }));
  };

  const addSubPart = (qi: number) => {
    updateQuestion(qi, q => {
      const nextLabel = String.fromCharCode('a'.charCodeAt(0) + q.subParts.length);
      return { ...q, subParts: [...q.subParts, { label: nextLabel, prompt: '', expectedAnswer: '', marks: 10 }] };
    });
  };

  const removeSubPart = (qi: number, si: number) => {
    updateQuestion(qi, q => ({ ...q, subParts: q.subParts.filter((_, i) => i !== si) }));
  };

  const addBlank = (qi: number, si: number) => {
    updateSubPart(qi, si, s => ({ ...s, blanks: [...(s.blanks ?? []), { label: '', expectedAnswer: '' }] }));
  };

  const updateBlank = (qi: number, si: number, bi: number, mut: (b: RTRBlank) => RTRBlank) => {
    updateSubPart(qi, si, s => ({ ...s, blanks: (s.blanks ?? []).map((b, i) => (i === bi ? mut(b) : b)) }));
  };

  const removeBlank = (qi: number, si: number, bi: number) => {
    updateSubPart(qi, si, s => {
      const blanks = (s.blanks ?? []).filter((_, i) => i !== bi);
      return { ...s, blanks: blanks.length > 0 ? blanks : undefined };
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rtr-part1-questions-template.csv';
    a.click();
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

  const handleBulkSubmit = async () => {
    if (!bulkParsed || bulkParsed.length === 0) return;
    setBulkUploading(true);
    try {
      const res = await fetch('/api/admin/rtr/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testId, questions: bulkParsed }),
      });
      const d = await res.json();
      setBulkResult(d);
      if (res.ok) { await fetchData(); setBulkParsed(null); setBulkErrors([]); }
    } catch {
      setBulkResult({ inserted: 0, errors: ['Network error'] });
    } finally {
      setBulkUploading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data?.test) return <div className="text-rose-600 py-20 text-center">Test not found</div>;

  const { test, questions, scenarios } = data;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/rtr" className="text-neutral-500 hover:text-neutral-900 transition-colors">← RTR Tests</Link>
        <div>
          <h1 className="text-3xl font-black text-neutral-900">{test.title}</h1>
          <p className="text-neutral-500 text-sm">₹{test.price} · {test.status}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">{questions.length}</p><p className="text-sm text-neutral-500">Part 1 Questions</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">{scenarios.length}</p><p className="text-sm text-neutral-500">Part 2 Charts</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">₹{test.price}</p><p className="text-sm text-neutral-500">Price</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('part1')} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'part1' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'}`}>Part 1 — MCQ ({questions.length})</button>
        <button onClick={() => setTab('part2')} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'part2' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'}`}>Part 2 — Charts ({scenarios.length})</button>
      </div>

      {tab === 'part1' && (
        <div>
          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={() => { setShowBulkModal(true); setBulkParsed(null); setBulkErrors([]); setBulkResult(null); }}
              className="px-4 py-2 bg-neutral-100 text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-200 transition-colors"
            >
              ↑ Bulk Upload CSV
            </button>
            <button onClick={openAddQ} className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors">+ Add MCQ Question</button>
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
                  {(q.image_url || q.pdf_url) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {q.image_url && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase tracking-wide">Image</span>}
                      {q.pdf_url && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase tracking-wide">PDF</span>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i === q.correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{String.fromCharCode(65 + i)}: {opt.substring(0, 30)}{opt.length > 30 ? '…' : ''}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEditQ(q)} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
                  <button onClick={() => deleteQ(q.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <div className="text-center py-16 text-neutral-500">No Part 1 questions yet.</div>}
          </div>
        </div>
      )}

      {tab === 'part2' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openAddS} className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors">+ Add Chart</button>
          </div>
          <div className="space-y-4">
            {scenarios.map((s, idx) => (
              <div key={s.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-emerald-600 font-black uppercase tracking-wider mb-1">Chart {idx + 1} · {s.marks} marks</p>
                    <p className="text-sm text-neutral-900 font-bold mb-1">{s.scenario}</p>
                    {s.chart_context && (
                      <p className="text-xs text-neutral-500">
                        {s.chart_context.aircraft_id} · {s.chart_context.departure} → {s.chart_context.destination}
                        {s.questions ? ` · ${s.questions.length} question${s.questions.length === 1 ? '' : 's'}` : ''}
                      </p>
                    )}
                    {!s.chart_context && s.exchanges && (
                      <p className="text-xs text-amber-700">Legacy dialogue scenario — re-create as chart to upgrade.</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEditS(s)} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
                    <button onClick={() => deleteS(s.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {scenarios.length === 0 && <div className="text-center py-16 text-neutral-500">No Part 2 charts yet.</div>}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-3xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{editItem.id ? 'Edit' : 'New'} {modalType === 'q' ? 'Part 1 Question' : 'Part 2 Chart'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl">&times;</button>
            </div>

            {modalType === 'q' && isQForm(editItem) && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Question *</label>
                  <textarea value={editItem.question || ''} onChange={e => setEditItem(p => ({ ...(p as QForm), question: e.target.value }))} rows={3} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                    Question Image <span className="text-neutral-400 normal-case font-normal">(optional — diagrams, charts, etc.)</span>
                  </label>
                  {imagePreviewUrl && (
                    <div className="relative mb-3 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreviewUrl} alt="Preview" className="h-40 w-auto rounded-xl border border-neutral-200 object-contain" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-rose-700 leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200 file:cursor-pointer"
                    />
                    {imageUploading && <span className="text-xs text-neutral-500 animate-pulse">Uploading…</span>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                    Question PDF <span className="text-neutral-400 normal-case font-normal">(optional — multi-page diagrams, extracts)</span>
                  </label>
                  {editItem.pdf_url && (
                    <div className="mb-3 flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>
                      <a href={editItem.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-900 font-semibold underline truncate flex-1">View attached PDF</a>
                      <button type="button" onClick={removePdf} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Remove</button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfSelect}
                      className="text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200 file:cursor-pointer"
                    />
                    {pdfUploading && <span className="text-xs text-neutral-500 animate-pulse">Uploading…</span>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Options (select correct)</label>
                  <div className="space-y-2">
                    {editItem.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="radio" name="correct_q" checked={editItem.correct === i} onChange={() => setEditItem(p => ({ ...(p as QForm), correct: i }))} className="w-4 h-4 accent-neutral-900 shrink-0" />
                        <span className="text-sm font-bold text-neutral-500 w-4">{String.fromCharCode(65 + i)}</span>
                        <input value={opt} onChange={e => updateOption(i, e.target.value)} className="flex-1 bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-400" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Explanation</label>
                  <textarea value={editItem.explanation || ''} onChange={e => setEditItem(p => ({ ...(p as QForm), explanation: e.target.value }))} rows={2} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" />
                </div>
              </div>
            )}

            {modalType === 's' && !isQForm(editItem) && (
              <div className="space-y-6">
                {/* Chart meta */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Chart Meta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Title (e.g. Chart No 6(V2)) *</label>
                      <input value={editItem.scenario || ''} onChange={e => setEditItem(p => ({ ...(p as SForm), scenario: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Total Marks</label>
                      <input type="number" value={editItem.marks} onChange={e => setEditItem(p => ({ ...(p as SForm), marks: Number(e.target.value) }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" />
                    </div>
                  </div>
                </section>

                {/* Chart context — fixed labels, admin fills bold values */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Chart Header (printed on paper)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Time Allowed</label>
                      <input value={editItem.chart_context.time_allowed} onChange={e => setChartField('time_allowed', e.target.value)} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Total Marks (header)</label>
                      <input type="number" value={editItem.chart_context.total_marks} onChange={e => setChartField('total_marks', Number(e.target.value))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                    {CHART_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">{label}</label>
                        <input
                          value={String(editItem.chart_context[key] ?? '')}
                          onChange={e => setChartField(key, e.target.value)}
                          className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Questions */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Questions</h3>
                    <button onClick={addQuestion} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-100">+ Add Question</button>
                  </div>
                  {editItem.questions.map((q, qi) => (
                    <div key={qi} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-neutral-500">Q#</label>
                          <input
                            type="number"
                            value={q.number}
                            onChange={e => updateQuestion(qi, qq => ({ ...qq, number: Number(e.target.value) }))}
                            className="w-16 bg-white border border-neutral-200 text-neutral-900 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-neutral-400"
                          />
                        </div>
                        <button onClick={() => removeQuestion(qi)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Remove Question</button>
                      </div>

                      {q.subParts.map((s, si) => (
                        <div key={si} className="bg-white border border-neutral-200 rounded-xl p-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Sub</label>
                              <input
                                value={s.label}
                                onChange={e => updateSubPart(qi, si, ss => ({ ...ss, label: e.target.value }))}
                                placeholder="a"
                                className="w-12 bg-white border border-neutral-200 text-neutral-900 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-neutral-400"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Marks</label>
                              <input
                                type="number"
                                value={s.marks}
                                onChange={e => updateSubPart(qi, si, ss => ({ ...ss, marks: Number(e.target.value) }))}
                                className="w-20 bg-white border border-neutral-200 text-neutral-900 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-neutral-400"
                              />
                            </div>
                            <button onClick={() => removeSubPart(qi, si)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto">Remove</button>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Prompt (read aloud to candidate)</label>
                            <textarea
                              rows={3}
                              value={s.prompt}
                              onChange={e => updateSubPart(qi, si, ss => ({ ...ss, prompt: e.target.value }))}
                              className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 resize-none"
                            />
                          </div>
                          {!s.blanks && (
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Expected Answer</label>
                              <textarea
                                rows={2}
                                value={s.expectedAnswer}
                                onChange={e => updateSubPart(qi, si, ss => ({ ...ss, expectedAnswer: e.target.value }))}
                                className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 resize-none"
                              />
                            </div>
                          )}
                          {/* Blanks (e.g. question 5 with multiple labelled fields) */}
                          {s.blanks && s.blanks.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase block">Fill-in-the-blanks</label>
                              {s.blanks.map((b, bi) => (
                                <div key={bi} className="flex gap-2 items-start">
                                  <input
                                    placeholder="Label (e.g. Classifications of AIRPROX are)"
                                    value={b.label}
                                    onChange={e => updateBlank(qi, si, bi, bb => ({ ...bb, label: e.target.value }))}
                                    className="flex-1 bg-white border border-neutral-200 text-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-400"
                                  />
                                  <input
                                    placeholder="Expected answer"
                                    value={b.expectedAnswer}
                                    onChange={e => updateBlank(qi, si, bi, bb => ({ ...bb, expectedAnswer: e.target.value }))}
                                    className="flex-1 bg-white border border-neutral-200 text-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-400"
                                  />
                                  <button onClick={() => removeBlank(qi, si, bi)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2">×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => addBlank(qi, si)} className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold">+ Add blank</button>
                          </div>
                        </div>
                      ))}

                      <button onClick={() => addSubPart(qi)} className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">+ Add sub-part</button>
                    </div>
                  ))}
                </section>
              </div>
            )}

            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={modalType === 'q' ? handleSaveQ : handleSaveS} disabled={saving || imageUploading || pdfUploading} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk upload modal (Part 1 MCQ) */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-3xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">Bulk Upload Part 1 Questions</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl leading-none">&times;</button>
            </div>

            <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-sm font-bold text-neutral-700 mb-2">CSV Format</p>
              <p className="text-xs text-neutral-500 mb-1">
                Columns: <code className="bg-neutral-200 px-1.5 py-0.5 rounded font-mono">question, option_a, option_b, option_c, option_d, correct_answer, explanation</code>
              </p>
              <p className="text-xs text-neutral-500 mb-3">
                <strong>correct_answer</strong> must be A, B, C, or D. Wrap text containing commas in double quotes.
              </p>
              <button onClick={downloadTemplate} className="text-xs px-3 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800">
                ↓ Download Template CSV
              </button>
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Upload CSV File</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleBulkCSV}
                className="text-sm text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-100 file:text-neutral-900 hover:file:bg-neutral-200 file:cursor-pointer"
              />
            </div>

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
              <div className="mb-5">
                <p className="text-sm font-bold text-neutral-700 mb-3">
                  {bulkParsed.length} question{bulkParsed.length !== 1 ? 's' : ''} ready to import
                  {bulkErrors.length > 0 && <span className="text-amber-600 font-normal text-xs ml-2">({bulkErrors.length} row{bulkErrors.length !== 1 ? 's' : ''} skipped due to errors)</span>}
                </p>
                <div className="max-h-64 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-100">
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
              <div className={`mb-5 p-4 rounded-xl border ${bulkResult.inserted > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                {bulkResult.inserted > 0 && (
                  <p className="text-sm font-bold text-emerald-700">✓ {bulkResult.inserted} question{bulkResult.inserted !== 1 ? 's' : ''} imported successfully</p>
                )}
                {bulkResult.errors && bulkResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {bulkResult.errors.map((e, i) => <li key={i} className="text-xs text-rose-600">{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-neutral-200">
              <button
                onClick={handleBulkSubmit}
                disabled={!bulkParsed || bulkParsed.length === 0 || bulkUploading}
                className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50"
              >
                {bulkUploading ? 'Importing…' : `Import ${bulkParsed?.length ?? 0} Question${(bulkParsed?.length ?? 0) !== 1 ? 's' : ''}`}
              </button>
              <button onClick={() => setShowBulkModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
