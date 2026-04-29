'use client';

import { use, useState, useEffect, useCallback } from 'react';
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

const EMPTY_Q: QForm = { question: '', options: ['', '', '', ''], correct: 0, explanation: '' };

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/rtr/tests/${testId}`);
    const d: RTRDetail = await res.json();
    setData(d);
    setLoading(false);
  }, [testId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const openAddQ = () => { setEditItem({ ...EMPTY_Q, test_id: testId }); setModalType('q'); setShowModal(true); };
  const openEditQ = (q: RTRPart1Question) => { setEditItem({ ...q, options: [...q.options] }); setModalType('q'); setShowModal(true); };
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

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-violet border-t-transparent rounded-full animate-spin" /></div>;
  if (!data?.test) return <div className="text-rose-400 py-20 text-center">Test not found</div>;

  const { test, questions, scenarios } = data;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/rtr" className="text-neutral-400 hover:text-white transition-colors">← RTR Tests</Link>
        <div>
          <h1 className="text-3xl font-black text-white">{test.title}</h1>
          <p className="text-neutral-400 text-sm">₹{test.price} · {test.status}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5"><p className="text-3xl font-black text-white">{questions.length}</p><p className="text-sm text-neutral-400">Part 1 Questions</p></div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5"><p className="text-3xl font-black text-white">{scenarios.length}</p><p className="text-sm text-neutral-400">Part 2 Charts</p></div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5"><p className="text-3xl font-black text-white">₹{test.price}</p><p className="text-sm text-neutral-400">Price</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('part1')} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'part1' ? 'bg-violet text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>Part 1 — MCQ ({questions.length})</button>
        <button onClick={() => setTab('part2')} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'part2' ? 'bg-violet text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>Part 2 — Charts ({scenarios.length})</button>
      </div>

      {tab === 'part1' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openAddQ} className="px-4 py-2 bg-violet text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors">+ Add MCQ Question</button>
          </div>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 flex items-start gap-4">
                <span className="text-neutral-600 font-black w-6 text-center shrink-0">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-2">{q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded ${i === q.correct ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-neutral-800 text-neutral-500'}`}>{String.fromCharCode(65 + i)}: {opt.substring(0, 30)}{opt.length > 30 ? '…' : ''}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEditQ(q)} className="text-xs text-neutral-400 hover:text-white font-semibold">Edit</button>
                  <button onClick={() => deleteQ(q.id)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold">Delete</button>
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
            <button onClick={openAddS} className="px-4 py-2 bg-violet text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors">+ Add Chart</button>
          </div>
          <div className="space-y-4">
            {scenarios.map((s, idx) => (
              <div key={s.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-violet font-black uppercase tracking-wider mb-1">Chart {idx + 1} · {s.marks} marks</p>
                    <p className="text-sm text-white font-bold mb-1">{s.scenario}</p>
                    {s.chart_context && (
                      <p className="text-xs text-neutral-500">
                        {s.chart_context.aircraft_id} · {s.chart_context.departure} → {s.chart_context.destination}
                        {s.questions ? ` · ${s.questions.length} question${s.questions.length === 1 ? '' : 's'}` : ''}
                      </p>
                    )}
                    {!s.chart_context && s.exchanges && (
                      <p className="text-xs text-amber-500">Legacy dialogue scenario — re-create as chart to upgrade.</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEditS(s)} className="text-xs text-neutral-400 hover:text-white font-semibold">Edit</button>
                    <button onClick={() => deleteS(s.id)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold">Delete</button>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-3xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">{editItem.id ? 'Edit' : 'New'} {modalType === 'q' ? 'Part 1 Question' : 'Part 2 Chart'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white text-2xl">&times;</button>
            </div>

            {modalType === 'q' && isQForm(editItem) && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Question *</label>
                  <textarea value={editItem.question || ''} onChange={e => setEditItem(p => ({ ...(p as QForm), question: e.target.value }))} rows={3} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Options (select correct)</label>
                  <div className="space-y-2">
                    {editItem.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="radio" name="correct_q" checked={editItem.correct === i} onChange={() => setEditItem(p => ({ ...(p as QForm), correct: i }))} className="w-4 h-4 accent-violet shrink-0" />
                        <span className="text-sm font-bold text-neutral-400 w-4">{String.fromCharCode(65 + i)}</span>
                        <input value={opt} onChange={e => updateOption(i, e.target.value)} className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Explanation</label>
                  <textarea value={editItem.explanation || ''} onChange={e => setEditItem(p => ({ ...(p as QForm), explanation: e.target.value }))} rows={2} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet resize-none" />
                </div>
              </div>
            )}

            {modalType === 's' && !isQForm(editItem) && (
              <div className="space-y-6">
                {/* Chart meta */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-violet uppercase tracking-widest">Chart Meta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Title (e.g. Chart No 6(V2)) *</label>
                      <input value={editItem.scenario || ''} onChange={e => setEditItem(p => ({ ...(p as SForm), scenario: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Total Marks</label>
                      <input type="number" value={editItem.marks} onChange={e => setEditItem(p => ({ ...(p as SForm), marks: Number(e.target.value) }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" />
                    </div>
                  </div>
                </section>

                {/* Chart context — fixed labels, admin fills bold values */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-violet uppercase tracking-widest">Chart Header (printed on paper)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Time Allowed</label>
                      <input value={editItem.chart_context.time_allowed} onChange={e => setChartField('time_allowed', e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Total Marks (header)</label>
                      <input type="number" value={editItem.chart_context.total_marks} onChange={e => setChartField('total_marks', Number(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet" />
                    </div>
                    {CHART_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">{label}</label>
                        <input
                          value={String(editItem.chart_context[key] ?? '')}
                          onChange={e => setChartField(key, e.target.value)}
                          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Questions */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-violet uppercase tracking-widest">Questions</h3>
                    <button onClick={addQuestion} className="px-3 py-1.5 bg-violet/20 text-violet text-xs font-bold rounded-lg hover:bg-violet/30">+ Add Question</button>
                  </div>
                  {editItem.questions.map((q, qi) => (
                    <div key={qi} className="bg-neutral-800/50 border border-neutral-700 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-neutral-400">Q#</label>
                          <input
                            type="number"
                            value={q.number}
                            onChange={e => updateQuestion(qi, qq => ({ ...qq, number: Number(e.target.value) }))}
                            className="w-16 bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-violet"
                          />
                        </div>
                        <button onClick={() => removeQuestion(qi)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold">Remove Question</button>
                      </div>

                      {q.subParts.map((s, si) => (
                        <div key={si} className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Sub</label>
                              <input
                                value={s.label}
                                onChange={e => updateSubPart(qi, si, ss => ({ ...ss, label: e.target.value }))}
                                placeholder="a"
                                className="w-12 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-violet"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Marks</label>
                              <input
                                type="number"
                                value={s.marks}
                                onChange={e => updateSubPart(qi, si, ss => ({ ...ss, marks: Number(e.target.value) }))}
                                className="w-20 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-violet"
                              />
                            </div>
                            <button onClick={() => removeSubPart(qi, si)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold ml-auto">Remove</button>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Prompt (read aloud to candidate)</label>
                            <textarea
                              rows={3}
                              value={s.prompt}
                              onChange={e => updateSubPart(qi, si, ss => ({ ...ss, prompt: e.target.value }))}
                              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet resize-none"
                            />
                          </div>
                          {!s.blanks && (
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Expected Answer</label>
                              <textarea
                                rows={2}
                                value={s.expectedAnswer}
                                onChange={e => updateSubPart(qi, si, ss => ({ ...ss, expectedAnswer: e.target.value }))}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet resize-none"
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
                                    className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet"
                                  />
                                  <input
                                    placeholder="Expected answer"
                                    value={b.expectedAnswer}
                                    onChange={e => updateBlank(qi, si, bi, bb => ({ ...bb, expectedAnswer: e.target.value }))}
                                    className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet"
                                  />
                                  <button onClick={() => removeBlank(qi, si, bi)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold px-2">×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => addBlank(qi, si)} className="text-[11px] text-violet hover:text-violet-300 font-bold">+ Add blank</button>
                          </div>
                        </div>
                      ))}

                      <button onClick={() => addSubPart(qi)} className="text-xs text-violet hover:text-violet-300 font-bold">+ Add sub-part</button>
                    </div>
                  ))}
                </section>
              </div>
            )}

            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-800">
              <button onClick={modalType === 'q' ? handleSaveQ : handleSaveS} disabled={saving} className="px-6 py-3 bg-violet text-white font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
