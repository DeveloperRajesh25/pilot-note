'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Exam } from '@/lib/types';
import { computeExamStatus } from '@/lib/exam-status';

interface ExamForm extends Partial<Exam> {
  registrations?: number;
  question_count?: number;
  // Local-only working fields — the form captures times in IST and the
  // selected date comes from `exam_date`. We compose start_at/end_at on save.
  _start_time?: string;
  _end_time?: string;
}

const SUBJECTS = ['Air Navigation', 'Meteorology', 'Air Regulations', 'Technical General', 'Technical Specific'];
const STATUSES = ['Upcoming', 'Active', 'Completed', 'Cancelled'];

const EMPTY_EXAM: ExamForm = {
  title: '', subject: SUBJECTS[0], description: '', exam_date: '',
  duration: 120, total_questions: 100, fee: 499, original_fee: null, status: 'Upcoming',
  start_at: null, end_at: null, per_question_seconds: 60, pass_score: 40,
  payment_provider: 'razorpay',
  _start_time: '10:00', _end_time: '',
};

function discountPct(fee: number, originalFee?: number | null): number | null {
  if (!originalFee || originalFee <= fee) return null;
  return Math.round(((originalFee - fee) / originalFee) * 100);
}

// Capture times as IST regardless of the admin's browser timezone.
const IST_TIME_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
});

function isoToIstTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return IST_TIME_FMT.format(d);
}

function combineDateTimeIST(date: string | null | undefined, time: string | undefined): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const STATUS_BADGE: Record<string, string> = {
  Upcoming: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Active: 'bg-amber-50 text-amber-700 border-amber-200',
  Live: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<ExamForm>(EMPTY_EXAM);
  const [saving, setSaving] = useState(false);
  const [, setNowTick] = useState(0);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/exams');
    const d = await res.json();
    setExams(d.exams ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchExams(); }, [fetchExams]);

  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const openEdit = (ex: ExamForm) => {
    setEditExam({
      ...ex,
      _start_time: isoToIstTime(ex.start_at) || (ex.exam_time?.slice(0, 5) ?? '10:00'),
      _end_time: isoToIstTime(ex.end_at),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editExam.title || !editExam.subject) { alert('Title and subject required'); return; }
    if (!editExam.exam_date) { alert('Exam date is required'); return; }
    if (!editExam._start_time) { alert('Start time is required'); return; }
    const feeVal = Number(editExam.fee ?? 0);
    if (!Number.isFinite(feeVal) || feeVal < 0) { alert('Fee must be 0 (free) or positive'); return; }
    const origFeeVal = editExam.original_fee == null || (editExam.original_fee as unknown) === '' ? null : Number(editExam.original_fee);
    if (origFeeVal !== null && (!Number.isFinite(origFeeVal) || origFeeVal < 0)) { alert('Original fee must be blank or non-negative'); return; }
    if (origFeeVal !== null && origFeeVal <= feeVal) { alert('Original fee must be greater than the live fee to show a discount'); return; }

    const start_at = combineDateTimeIST(editExam.exam_date, editExam._start_time);
    const end_at = editExam._end_time
      ? combineDateTimeIST(editExam.exam_date, editExam._end_time)
      : null;

    const payload: Record<string, unknown> = {
      ...editExam,
      start_at,
      end_at,
      exam_time: editExam._start_time, // keep legacy column in sync
    };
    delete payload._start_time;
    delete payload._end_time;
    delete payload.registrations;

    setSaving(true);
    const isEdit = !!editExam.id;
    const url = isEdit ? `/api/admin/exams/${editExam.id}` : '/api/admin/exams';
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setShowModal(false); await fetchExams(); }
    else { const d = await res.json(); alert(d.error || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam?')) return;
    await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
    await fetchExams();
  };

  const changeStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/exams/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchExams();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">Pariksha Exams</h1>
          <p className="text-neutral-500">{exams.length} exams</p>
        </div>
        <button onClick={() => { setEditExam({ ...EMPTY_EXAM }); setShowModal(true); }}
          className="px-5 py-2.5 bg-neutral-900 text-white font-bold text-sm rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2">
          <span>+</span> New Exam
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-neutral-100 rounded-2xl border border-neutral-200 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {exams.map((ex) => {
            const live = computeExamStatus(ex);
            const liveLabel = live === 'Active' ? 'Live' : live;
            const qCount = ex.question_count ?? 0;
            const noQuestions = qCount === 0;
            const shortOnQuestions = !noQuestions && ex.total_questions ? qCount < ex.total_questions : false;
            return (
              <div key={ex.id} className={`bg-white rounded-2xl border p-6 hover:shadow-sm transition-all ${noQuestions ? 'border-amber-300 ring-1 ring-amber-200' : 'border-neutral-200 hover:border-neutral-300'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-black text-neutral-900">{ex.title}</h3>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${STATUS_BADGE[liveLabel] ?? STATUS_BADGE.Upcoming}`}>{liveLabel}</span>
                      {noQuestions && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                          <span>⚠</span> No questions
                        </span>
                      )}
                      {shortOnQuestions && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                          {qCount}/{ex.total_questions} Qs added
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">{ex.subject}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                      <span>📅 {ex.exam_date ? new Date(ex.exam_date).toLocaleDateString('en-IN') : 'TBD'}</span>
                      <span>⏰ {isoToIstTime(ex.start_at) || ex.exam_time || 'TBD'}</span>
                      <span>⏱ {ex.duration} min</span>
                      <span className={noQuestions ? 'text-amber-700 font-bold' : ''}>❓ {qCount}/{ex.total_questions} Qs</span>
                      <span>👥 {ex.registrations ?? 0} registered</span>
                      {ex.fee === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">🎁 Free</span>
                      ) : (() => {
                        const pct = discountPct(ex.fee ?? 0, ex.original_fee);
                        return pct ? (
                          <span className="inline-flex items-center gap-2">
                            <span>💳 ₹{ex.fee}</span>
                            <span className="line-through text-neutral-400">₹{ex.original_fee}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">-{pct}%</span>
                          </span>
                        ) : <span>💳 ₹{ex.fee}</span>;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/exams/${ex.id}`}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${noQuestions ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'}`}
                    >
                      {noQuestions ? '+ Add Questions' : 'Questions →'}
                    </Link>
                    <select value={ex.status} onChange={e => ex.id && changeStatus(ex.id, e.target.value)} className="bg-white border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-neutral-400">
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => openEdit(ex)} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
                    <button onClick={() => ex.id && handleDelete(ex.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
                  </div>
                </div>
                {noQuestions && (
                  <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between gap-4">
                    <p className="text-xs text-amber-800">
                      <span className="font-bold">This exam has no questions yet.</span> Candidates can&apos;t take an empty exam — add questions before it goes live.
                    </p>
                    <Link
                      href={`/admin/exams/${ex.id}`}
                      className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Add questions →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
          {exams.length === 0 && <div className="text-center py-24 text-neutral-500">No exams yet.</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{editExam.id ? 'Edit Exam' : 'New Exam'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Title *</label><input value={editExam.title || ''} onChange={e => setEditExam(p => ({ ...p, title: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Subject</label>
                  <select value={editExam.subject} onChange={e => setEditExam(p => ({ ...p, subject: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400">
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Status</label>
                  <select value={editExam.status} onChange={e => setEditExam(p => ({ ...p, status: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Description</label><textarea value={editExam.description || ''} onChange={e => setEditExam(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 resize-none" /></div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Exam Date *</label>
                <input type="date" value={editExam.exam_date || ''} onChange={e => setEditExam(p => ({ ...p, exam_date: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Duration (min)</label><input type="number" value={editExam.duration || 120} onChange={e => setEditExam(p => ({ ...p, duration: Number(e.target.value) }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" /></div>
                <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Questions</label><input type="number" value={editExam.total_questions || 100} onChange={e => setEditExam(p => ({ ...p, total_questions: Number(e.target.value) }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" /></div>
              </div>

              {/* Pricing — supports free exams (fee=0) and sticker-price discounts. */}
              <div className="border-t border-neutral-200 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pricing</p>
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(editExam.fee ?? 0) === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditExam(p => ({ ...p, fee: 0 }));
                        } else {
                          // Reasonable default when toggling off free.
                          setEditExam(p => ({ ...p, fee: p.fee && p.fee > 0 ? p.fee : 499 }));
                        }
                      }}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    Make this exam free
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Live fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={editExam.fee ?? 0}
                      disabled={(editExam.fee ?? 0) === 0}
                      onChange={e => setEditExam(p => ({ ...p, fee: Number(e.target.value) }))}
                      className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">What the candidate actually pays. 0 = free.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Original fee (₹) — optional</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Leave blank for no discount"
                      value={editExam.original_fee ?? ''}
                      onChange={e => {
                        const v = e.target.value;
                        setEditExam(p => ({ ...p, original_fee: v === '' ? null : Number(v) }));
                      }}
                      className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">Marketed sticker price. Shown struck-through when greater than live fee.</p>
                  </div>
                </div>
                {(() => {
                  const fee = editExam.fee ?? 0;
                  const pct = discountPct(fee, editExam.original_fee);
                  if (fee === 0) {
                    return <p className="text-[11px] text-emerald-700 font-bold mt-2">🎁 This exam will be offered free of cost.</p>;
                  }
                  if (pct) {
                    return <p className="text-[11px] text-rose-700 font-bold mt-2">Candidates will see ₹{fee} with ₹{editExam.original_fee} struck through ({pct}% off).</p>;
                  }
                  return null;
                })()}
              </div>

              {/* Pariksha v2 — synchronized window + grading. Date is taken from Exam Date above; we only collect the IST clock times. */}
              <div className="border-t border-neutral-200 pt-4 mt-2">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Exam window (server-authoritative · IST)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Start time</label>
                    <input
                      type="time"
                      value={editExam._start_time || ''}
                      onChange={e => setEditExam(p => ({ ...p, _start_time: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">End time</label>
                    <input
                      type="time"
                      value={editExam._end_time || ''}
                      onChange={e => setEditExam(p => ({ ...p, _end_time: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-2">All registered users start and end at exactly these timestamps on the chosen exam date. Leave end blank to fall back to start + duration.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Per-question seconds</label>
                  <input type="number" min={5} value={editExam.per_question_seconds ?? 60} onChange={e => setEditExam(p => ({ ...p, per_question_seconds: Number(e.target.value) }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Pass score (%)</label>
                  <input type="number" min={0} max={100} value={editExam.pass_score ?? 40} onChange={e => setEditExam(p => ({ ...p, pass_score: Number(e.target.value) }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save Exam'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
