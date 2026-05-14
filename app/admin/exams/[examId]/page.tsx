'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Exam, ExamQuestion, ExamRegistration } from '@/lib/types';

const EMPTY_Q: QuestionForm = { question: '', options: ['', '', '', ''], correct: 0, explanation: '' };

interface QuestionForm {
  id?: string;
  exam_id?: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
}

interface RegistrationRow extends ExamRegistration {
  profiles?: { full_name: string | null; email: string | null } | null;
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
  exam: Exam | null;
  questions: ExamQuestion[];
  registrations: RegistrationRow[];
  attempts: AttemptRow[];
}

export default function AdminExamDetailPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const [data, setData] = useState<ExamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'questions' | 'registrations' | 'results'>('questions');
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState<QuestionForm>({ ...EMPTY_Q });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/exams/${examId}`);
    const d: ExamDetailData = await res.json();
    setData(d);
    setLoading(false);
  }, [examId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const openAdd = () => { setEditQ({ ...EMPTY_Q, exam_id: examId }); setShowModal(true); };
  const openEdit = (q: ExamQuestion) => { setEditQ({ ...q, options: [...q.options] }); setShowModal(true); };

  const handleSave = async () => {
    const isEdit = !!editQ.id;
    const url = isEdit ? `/api/admin/exam-questions/${editQ.id}` : '/api/admin/exam-questions';
    setSaving(true);
    const payload = isEdit ? editQ : { ...editQ, exam_id: examId };
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setShowModal(false); await fetchData(); }
    else { const d = await res.json(); alert(d.error || 'Error'); }
  };

  const deleteQ = async (id: string) => {
    if (!confirm('Delete question?')) return;
    await fetch(`/api/admin/exam-questions/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const updateOption = (i: number, val: string) => {
    setEditQ(p => {
      const opts = [...p.options];
      opts[i] = val;
      return { ...p, options: opts };
    });
  };

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data?.exam) return <div className="text-rose-600 py-20 text-center">Exam not found</div>;

  const { exam, questions, registrations, attempts } = data;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/exams" className="text-neutral-500 hover:text-neutral-900">← Exams</Link>
        <div>
          <h1 className="text-3xl font-black text-neutral-900">{exam.title}</h1>
          <p className="text-neutral-500 text-sm">{exam.subject} · {exam.status} · ₹{exam.fee}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">{questions.length}</p><p className="text-sm text-neutral-500">Questions</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">{registrations.length}</p><p className="text-sm text-neutral-500">Registered</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">{attempts.length}</p><p className="text-sm text-neutral-500">Submitted</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5"><p className="text-3xl font-black text-neutral-900">₹{exam.fee * registrations.length}</p><p className="text-sm text-neutral-500">Revenue</p></div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['questions', 'registrations', 'results'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors capitalize ${tab === t ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'}`}>{t} {t === 'questions' ? `(${questions.length})` : t === 'registrations' ? `(${registrations.length})` : `(${attempts.length})`}</button>
        ))}
      </div>

      {tab === 'questions' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openAdd} className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800">+ Add Question</button>
          </div>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start gap-4">
                <span className="text-neutral-400 font-black w-6 text-center">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-neutral-900 font-medium mb-2">{q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i === q.correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{String.fromCharCode(65 + i)}: {opt.substring(0, 30)}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(q)} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
                  <button onClick={() => deleteQ(q.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <div className="text-center py-16 text-neutral-500">No questions added yet.</div>}
          </div>
        </div>
      )}

      {tab === 'registrations' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="border-b border-neutral-200"><th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">User</th><th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Email</th><th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Registered</th></tr></thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100"><td className="px-6 py-3 text-sm text-neutral-900">{r.profiles?.full_name || '—'}</td><td className="px-6 py-3 text-sm text-neutral-500">{r.profiles?.email}</td><td className="px-6 py-3 text-sm text-neutral-500">{new Date(r.registered_at).toLocaleDateString('en-IN')}</td></tr>
              ))}
              {registrations.length === 0 && <tr><td colSpan={3} className="px-6 py-12 text-center text-neutral-500">No registrations</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'results' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">User</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Score</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">%</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Flags</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Auto?</th>
                <th className="px-6 py-3 text-xs font-black text-neutral-500 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const pct = a.total ? Math.round(((a.score ?? 0) / a.total) * 100) : 0;
                const passThreshold = exam.pass_score ?? 40;
                const passed = pct >= passThreshold;
                const violations = a.violations ?? [];
                const violationSummary = violations.reduce<Record<string, number>>((acc, v) => {
                  acc[v.type] = (acc[v.type] ?? 0) + 1;
                  return acc;
                }, {});
                const summaryStr = Object.entries(violationSummary)
                  .map(([t, n]) => `${t} × ${n}`)
                  .join(', ');
                return (
                  <tr key={a.user_id} className="border-b border-neutral-100">
                    <td className="px-6 py-3 text-sm text-neutral-500">{a.profiles?.email}</td>
                    <td className="px-6 py-3 text-sm text-neutral-900 font-bold">{a.score}/{a.total}</td>
                    <td className="px-6 py-3"><span className={`text-sm font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{pct}%</span></td>
                    <td className="px-6 py-3">
                      {violations.length > 0 ? (
                        <span title={summaryStr} className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
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
              {attempts.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-500">No results yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-2xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{editQ.id ? 'Edit Question' : 'New Question'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Question *</label><textarea value={editQ.question || ''} onChange={e => setEditQ(p => ({ ...p, question: e.target.value }))} rows={3} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" /></div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Options</label>
                <div className="space-y-2">
                  {editQ.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="radio" name="correct_eq" checked={editQ.correct === i} onChange={() => setEditQ(p => ({ ...p, correct: i }))} className="w-4 h-4 accent-neutral-900" />
                      <span className="text-sm font-bold text-neutral-500 w-4">{String.fromCharCode(65 + i)}</span>
                      <input value={opt} onChange={e => updateOption(i, e.target.value)} className="flex-1 bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                  ))}
                </div>
              </div>
              <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Explanation</label><textarea value={editQ.explanation || ''} onChange={e => setEditQ(p => ({ ...p, explanation: e.target.value }))} rows={2} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
