'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Exam, ExamQuestion, ExamRegistration } from '@/lib/types';
import { computeExamStatus, isRegistrationOpen } from '@/lib/exam-status';

const EMPTY_Q: QuestionForm = { question: '', options: ['', '', '', ''], correct: 0, explanation: '', image_url: null };

const CSV_TEMPLATE = `question,option_a,option_b,option_c,option_d,correct_answer,explanation
"What is the minimum VFR visibility?","1 km","3 km","5 km","8 km","C","VFR requires 5 km visibility in most airspace"
"ATC stands for?","Air Traffic Control","Altitude Transfer Check","Air Terrain Clearance","Auto Taxi Control","A","ATC = Air Traffic Control"`;

interface QuestionForm {
  id?: string;
  exam_id?: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  image_url?: string | null;
}

interface BulkRow {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface RegistrationRow extends ExamRegistration {
  profiles?: { full_name: string | null; email: string | null } | null;
  dob?: string | null;
  roll_no?: string | null;
  credentials_sent_at?: string | null;
}

interface AttemptRow {
  user_id: string;
  exam_id: string;
  score: number | null;
  total: number | null;
  submitted_at: string;
  auto_submitted?: boolean;
  violations?: { type: string; at: string }[];
  profiles?: { email: string | null; full_name: string | null } | null;
}

interface ExamDetailData {
  exam: (Exam & { credentials_released_at?: string | null; results_released_at?: string | null }) | null;
  questions: ExamQuestion[];
  registrations: RegistrationRow[];
  attempts: AttemptRow[];
}

interface ReleaseResult {
  ok?: boolean;
  sent?: number;
  assigned?: number;
  eligible?: number;
  missingDob?: number;
  ranked?: number;
  errors?: string[];
  message?: string;
  error?: string;
}

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

export default function AdminExamDetailPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const [data, setData] = useState<ExamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'questions' | 'registrations' | 'results'>('questions');

  // Single question modal
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState<QuestionForm>({ ...EMPTY_Q });
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk upload modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkParsed, setBulkParsed] = useState<BulkRow[] | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ inserted: number; errors?: string[] } | null>(null);

  // Release state (credentials + results)
  const [releasing, setReleasing] = useState<'creds' | 'results' | null>(null);
  const [releaseMsg, setReleaseMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/exams/${examId}`);
    const d: ExamDetailData = await res.json();
    setData(d);
    setLoading(false);
  }, [examId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditQ({ ...EMPTY_Q, exam_id: examId });
    setImagePreviewUrl(null);
    setShowModal(true);
  };

  const openEdit = (q: ExamQuestion) => {
    setEditQ({ ...q, options: [...q.options] });
    setImagePreviewUrl(q.image_url ?? null);
    setShowModal(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/exam-questions/upload-image', { method: 'POST', body: formData });
      const d = await res.json();
      if (d.url) setEditQ(p => ({ ...p, image_url: d.url }));
      else alert(d.error ?? 'Image upload failed');
    } catch {
      alert('Image upload failed — check network connection');
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setEditQ(p => ({ ...p, image_url: null }));
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (imageUploading) { alert('Image is still uploading, please wait.'); return; }
    const trimmedQ = editQ.question.trim();
    const trimmedOpts = editQ.options.map((o) => o.trim());
    if (!trimmedQ) { alert('Question text is required.'); return; }
    if (trimmedOpts.some((o) => !o)) { alert('All four options must be filled in.'); return; }
    if (editQ.correct < 0 || editQ.correct >= trimmedOpts.length) { alert('Pick which option is the correct answer.'); return; }
    const isEdit = !!editQ.id;
    const url = isEdit ? `/api/admin/exam-questions/${editQ.id}` : '/api/admin/exam-questions';
    setSaving(true);
    const payload = { ...editQ, question: trimmedQ, options: trimmedOpts, exam_id: examId };
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setShowModal(false); await fetchData(); }
    else { const d = await res.json(); alert(d.error || 'Error saving question'); }
  };

  const deleteQ = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/admin/exam-questions/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const releaseCredentials = async (resend: boolean) => {
    if (releasing) return;
    if (!confirm(resend
      ? 'Re-send credentials to ALL eligible candidates (including those already emailed)?'
      : 'Send credentials emails to all paid registrations that have a DOB on file?')) return;
    setReleasing('creds');
    setReleaseMsg(null);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/release-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resend }),
      });
      const d: ReleaseResult = await res.json();
      if (!res.ok || d.error) {
        setReleaseMsg({ kind: 'error', text: d.error ?? 'Release failed' });
      } else {
        const lines: string[] = [];
        if (d.sent !== undefined) lines.push(`${d.sent} email(s) sent`);
        if (d.assigned) lines.push(`${d.assigned} roll number(s) assigned`);
        if (d.missingDob) lines.push(`${d.missingDob} missing DOB`);
        if (d.errors?.length) lines.push(`${d.errors.length} error(s)`);
        setReleaseMsg({ kind: 'success', text: lines.join(' · ') || (d.message ?? 'Done') });
      }
      await fetchData();
    } catch (e) {
      setReleaseMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Network error' });
    } finally {
      setReleasing(null);
    }
  };

  const releaseResults = async (resend: boolean) => {
    if (releasing) return;
    if (!confirm(resend
      ? 'Re-send results to ALL candidates (including those already emailed)?'
      : 'Compute ranks and send result emails to all submitted attempts?')) return;
    setReleasing('results');
    setReleaseMsg(null);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/release-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resend }),
      });
      const d: ReleaseResult = await res.json();
      if (!res.ok || d.error) {
        setReleaseMsg({ kind: 'error', text: d.error ?? 'Release failed' });
      } else {
        const lines: string[] = [];
        if (d.sent !== undefined) lines.push(`${d.sent} email(s) sent`);
        if (d.ranked) lines.push(`${d.ranked} ranked`);
        if (d.errors?.length) lines.push(`${d.errors.length} error(s)`);
        setReleaseMsg({ kind: 'success', text: lines.join(' · ') || (d.message ?? 'Done') });
      }
      await fetchData();
    } catch (e) {
      setReleaseMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Network error' });
    } finally {
      setReleasing(null);
    }
  };

  const updateOption = (i: number, val: string) => {
    setEditQ(p => { const opts = [...p.options]; opts[i] = val; return { ...p, options: opts }; });
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam-questions-template.csv';
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
      const res = await fetch('/api/admin/exam-questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: examId, questions: bulkParsed }),
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
  if (!data?.exam) return <div className="text-rose-600 py-20 text-center">Exam not found</div>;

  const { exam, questions, registrations, attempts } = data;
  const paidCount = registrations.filter(r => r.payment_id).length;

  // Live ranking so the admin always sees who placed where — even before
  // results are released. Standard competition ranking: ties share a rank
  // ("1, 2, 2, 4"), earlier submission breaks ties only for ordering.
  const rankedAttempts = (() => {
    const sorted = [...attempts].sort((a, b) => {
      const sa = a.score ?? 0, sb = b.score ?? 0;
      if (sb !== sa) return sb - sa;
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });
    let currentRank = 0;
    let prevScore = Number.NaN;
    return sorted.map((a, idx) => {
      const score = a.score ?? 0;
      if (score !== prevScore) { currentRank = idx + 1; prevScore = score; }
      return { ...a, rank: currentRank };
    });
  })();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/exams" className="text-neutral-500 hover:text-neutral-900">← Exams</Link>
        <div>
          <h1 className="text-3xl font-black text-neutral-900">{exam.title}</h1>
          <p className="text-neutral-500 text-sm">
            {exam.subject} · {(() => { const s = computeExamStatus(exam); return s === 'Active' ? 'Live' : s; })()}
            {' · '}{isRegistrationOpen(exam) ? 'Registrations open' : 'Registrations closed'}
            {' · '}₹{exam.fee}
            {exam.exam_date && ` · ${new Date(exam.exam_date).toLocaleDateString('en-IN')}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-3xl font-black text-neutral-900">{questions.length}</p>
          <p className="text-sm text-neutral-500">Questions</p>
          <p className="text-xs text-neutral-400 mt-1">{exam.total_questions} required</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-3xl font-black text-neutral-900">{registrations.length}</p>
          <p className="text-sm text-neutral-500">Registered</p>
          {exam.fee > 0 && <p className="text-xs text-emerald-600 mt-1">{paidCount} confirmed paid</p>}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-3xl font-black text-neutral-900">{attempts.length}</p>
          <p className="text-sm text-neutral-500">Submitted</p>
          {registrations.length > 0 && (
            <p className="text-xs text-neutral-400 mt-1">{Math.round((attempts.length / registrations.length) * 100)}% turnout</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-3xl font-black text-neutral-900">₹{exam.fee * registrations.length}</p>
          <p className="text-sm text-neutral-500">Revenue</p>
          {exam.fee > 0 && <p className="text-xs text-neutral-400 mt-1">₹{exam.fee} per seat</p>}
        </div>
      </div>

      {/* Release controls */}
      <div className="mb-8 bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-wider mb-1">Release controls</p>
            <p className="text-sm text-neutral-700">
              {exam.credentials_released_at ? (
                <span className="text-emerald-700 font-semibold">
                  ✓ Credentials released {new Date(exam.credentials_released_at).toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="text-neutral-500">Credentials not yet released.</span>
              )}
              <span className="mx-2 text-neutral-300">|</span>
              {exam.results_released_at ? (
                <span className="text-emerald-700 font-semibold">
                  ✓ Results released {new Date(exam.results_released_at).toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="text-neutral-500">Results not yet released.</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => releaseCredentials(false)}
              disabled={!!releasing || registrations.filter(r => r.payment_id).length === 0}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              {releasing === 'creds' ? 'Sending…' : (exam.credentials_released_at ? 'Send to new registrations' : 'Release credentials')}
            </button>
            {exam.credentials_released_at && (
              <button
                onClick={() => releaseCredentials(true)}
                disabled={!!releasing}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 disabled:opacity-50"
              >
                Resend to all
              </button>
            )}
            <button
              onClick={() => releaseResults(false)}
              disabled={!!releasing || attempts.length === 0}
              className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50"
            >
              {releasing === 'results' ? 'Sending…' : (exam.results_released_at ? 'Send to new submissions' : 'Release results')}
            </button>
            {exam.results_released_at && (
              <button
                onClick={() => releaseResults(true)}
                disabled={!!releasing}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 disabled:opacity-50"
              >
                Resend results to all
              </button>
            )}
          </div>
        </div>
        {releaseMsg && (
          <div className={`mt-4 text-xs px-3 py-2 rounded-lg border ${
            releaseMsg.kind === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {releaseMsg.text}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['questions', 'registrations', 'results'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors capitalize ${tab === t ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'}`}
          >
            {t} {t === 'questions' ? `(${questions.length})` : t === 'registrations' ? `(${registrations.length})` : `(${attempts.length})`}
          </button>
        ))}
      </div>

      {/* Questions tab */}
      {tab === 'questions' && (
        <div>
          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={() => { setShowBulkModal(true); setBulkParsed(null); setBulkErrors([]); setBulkResult(null); }}
              className="px-4 py-2 bg-neutral-100 text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-200"
            >
              ↑ Bulk Upload CSV
            </button>
            <button onClick={openAdd} className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800">
              + Add Question
            </button>
          </div>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start gap-4">
                <span className="text-neutral-400 font-black w-6 text-center shrink-0 mt-0.5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  {q.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.image_url} alt="diagram" className="h-16 w-auto mb-2 rounded-lg border border-neutral-200 object-contain" />
                  )}
                  <p className="text-sm text-neutral-900 font-medium mb-2">{q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i === q.correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                        {String.fromCharCode(65 + i)}: {opt.substring(0, 30)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(q)} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
                  <button onClick={() => deleteQ(q.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <div className="text-center py-16 text-neutral-500">No questions added yet.</div>}
          </div>
        </div>
      )}

      {/* Registrations tab */}
      {tab === 'registrations' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-190">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-xs font-black text-neutral-500 uppercase">Roll No</th>
                <th className="px-4 py-3 text-xs font-black text-neutral-500 uppercase">Email</th>
                <th className="px-4 py-3 text-xs font-black text-neutral-500 uppercase">DOB</th>
                <th className="px-4 py-3 text-xs font-black text-neutral-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-xs font-black text-neutral-500 uppercase">Credentials</th>
                <th className="px-4 py-3 text-xs font-black text-neutral-500 uppercase">Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 text-xs font-mono text-neutral-900">
                    {r.roll_no || <span className="text-neutral-400 font-sans">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {r.profiles?.full_name && <div className="text-neutral-900 font-medium">{r.profiles.full_name}</div>}
                    <div className="text-neutral-500 text-xs">{r.profiles?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700 font-mono">
                    {r.dob ? new Date(r.dob).toLocaleDateString('en-GB') : <span className="text-amber-600 font-bold">missing</span>}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">
                    {exam.fee === 0
                      ? <span className="text-emerald-600">Free</span>
                      : r.payment_id
                        ? <span className="text-emerald-600">✓</span>
                        : <span className="text-amber-600">Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.credentials_sent_at
                      ? <span className="text-emerald-700 font-semibold">Sent {new Date(r.credentials_sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(r.registered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-500">No registrations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Results tab */}
      {tab === 'results' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">User</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Score</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">%</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Result</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Flags</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Auto?</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rankedAttempts.map((a) => {
                const pct = a.total ? Math.round(((a.score ?? 0) / a.total) * 100) : 0;
                const passThreshold = exam.pass_score ?? 40;
                const passed = pct >= passThreshold;
                const violations = a.violations ?? [];
                const violationSummary = violations.reduce<Record<string, number>>((acc, v) => {
                  acc[v.type] = (acc[v.type] ?? 0) + 1;
                  return acc;
                }, {});
                const summaryStr = Object.entries(violationSummary).map(([t, n]) => `${t} × ${n}`).join(', ');
                return (
                  <tr key={a.user_id} className="border-b border-neutral-100">
                    <td className="px-6 py-3 text-sm font-black text-neutral-900 tabular-nums">#{a.rank}</td>
                    <td className="px-6 py-3 text-sm text-neutral-500">{a.profiles?.email}</td>
                    <td className="px-6 py-3 text-sm text-neutral-900 font-bold">{a.score ?? 0}/{a.total ?? 0}</td>
                    <td className="px-6 py-3"><span className={`text-sm font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{pct}%</span></td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {violations.length > 0 ? (
                        <span title={summaryStr} className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 cursor-help">
                          {violations.length}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-neutral-500">{a.auto_submitted ? 'Auto' : 'Manual'}</td>
                    <td className="px-6 py-3 text-sm text-neutral-500">{new Date(a.submitted_at).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
              {attempts.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-neutral-500">No results yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Single question modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-2xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{editQ.id ? 'Edit Question' : 'New Question'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Question *</label>
                <textarea
                  value={editQ.question || ''}
                  onChange={e => setEditQ(p => ({ ...p, question: e.target.value }))}
                  rows={3}
                  className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none"
                />
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
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-rose-700 leading-none"
                    >
                      &times;
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
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
                  Options <span className="text-neutral-400 normal-case font-normal">(select the radio button for the correct answer)</span>
                </label>
                <div className="space-y-2">
                  {editQ.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correct_eq"
                        checked={editQ.correct === i}
                        onChange={() => setEditQ(p => ({ ...p, correct: i }))}
                        className="w-4 h-4 accent-neutral-900 shrink-0"
                      />
                      <span className="text-sm font-bold text-neutral-500 w-4 shrink-0">{String.fromCharCode(65 + i)}</span>
                      <input
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        className="flex-1 bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Explanation</label>
                <textarea
                  value={editQ.explanation || ''}
                  onChange={e => setEditQ(p => ({ ...p, explanation: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button
                onClick={handleSave}
                disabled={saving || imageUploading}
                className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk upload modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-3xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">Bulk Upload Questions</h2>
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
