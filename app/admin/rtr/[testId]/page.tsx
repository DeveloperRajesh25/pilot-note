'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const EMPTY_Q = { question: '', options: ['', '', '', ''], correct: 0, explanation: '' };

export default function AdminRTRTestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'part1' | 'part2'>('part1');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'q' | 's'>('q');
  const [editItem, setEditItem] = useState<any>(EMPTY_Q);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/rtr/tests/${testId}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [testId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddQ = () => { setEditItem({ ...EMPTY_Q, options: ['', '', '', ''], test_id: testId }); setModalType('q'); setShowModal(true); };
  const openEditQ = (q: any) => { setEditItem({ ...q, options: [...q.options] }); setModalType('q'); setShowModal(true); };
  const openAddS = () => { setEditItem({ test_id: testId, scenario: '', instruction: '', marks: 15, exchanges: '[]' }); setModalType('s'); setShowModal(true); };
  const openEditS = (s: any) => { setEditItem({ ...s, exchanges: typeof s.exchanges === 'string' ? s.exchanges : JSON.stringify(s.exchanges, null, 2) }); setModalType('s'); setShowModal(true); };

  const handleSaveQ = async () => {
    const isEdit = !!editItem.id;
    const url = isEdit ? `/api/admin/rtr/questions/${editItem.id}` : '/api/admin/rtr/questions';
    setSaving(true);
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) });
    setSaving(false);
    if (res.ok) { setShowModal(false); await fetchData(); }
    else { const d = await res.json(); alert(d.error || 'Save failed'); }
  };

  const handleSaveS = async () => {
    let exchanges;
    try { exchanges = JSON.parse(editItem.exchanges); } catch { alert('Invalid JSON in exchanges field'); return; }
    const payload = { ...editItem, exchanges };
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
    if (!confirm('Delete scenario?')) return;
    await fetch(`/api/admin/rtr/scenarios/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const updateOption = (i: number, val: string) => {
    setEditItem((p: any) => { const opts = [...p.options]; opts[i] = val; return { ...p, options: opts }; });
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
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5"><p className="text-3xl font-black text-white">{scenarios.length}</p><p className="text-sm text-neutral-400">Part 2 Scenarios</p></div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5"><p className="text-3xl font-black text-white">₹{test.price}</p><p className="text-sm text-neutral-400">Price</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('part1')} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'part1' ? 'bg-violet text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>Part 1 — MCQ ({questions.length})</button>
        <button onClick={() => setTab('part2')} className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'part2' ? 'bg-violet text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>Part 2 — RT Scenarios ({scenarios.length})</button>
      </div>

      {tab === 'part1' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openAddQ} className="px-4 py-2 bg-violet text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors">+ Add MCQ Question</button>
          </div>
          <div className="space-y-3">
            {questions.map((q: any, idx: number) => (
              <div key={q.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 flex items-start gap-4">
                <span className="text-neutral-600 font-black w-6 text-center flex-shrink-0">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-2">{q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt: string, i: number) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded ${i === q.correct ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-neutral-800 text-neutral-500'}`}>{String.fromCharCode(65 + i)}: {opt.substring(0, 30)}{opt.length > 30 ? '…' : ''}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
            <button onClick={openAddS} className="px-4 py-2 bg-violet text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors">+ Add Scenario</button>
          </div>
          <div className="space-y-4">
            {scenarios.map((s: any, idx: number) => (
              <div key={s.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-violet font-black uppercase tracking-wider mb-1">Scenario {idx + 1} · {s.marks} marks</p>
                    <p className="text-sm text-white font-bold mb-1">{s.scenario}</p>
                    <p className="text-xs text-neutral-500">{s.instruction}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEditS(s)} className="text-xs text-neutral-400 hover:text-white font-semibold">Edit</button>
                    <button onClick={() => deleteS(s.id)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {scenarios.length === 0 && <div className="text-center py-16 text-neutral-500">No Part 2 scenarios yet.</div>}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-2xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">{editItem.id ? 'Edit' : 'New'} {modalType === 'q' ? 'Part 1 Question' : 'Part 2 Scenario'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white text-2xl">&times;</button>
            </div>

            {modalType === 'q' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Question *</label>
                  <textarea value={editItem.question || ''} onChange={e => setEditItem((p: any) => ({ ...p, question: e.target.value }))} rows={3} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Options (select correct)</label>
                  <div className="space-y-2">
                    {(editItem.options ?? ['', '', '', '']).map((opt: string, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="radio" name="correct_q" checked={editItem.correct === i} onChange={() => setEditItem((p: any) => ({ ...p, correct: i }))} className="w-4 h-4 accent-violet flex-shrink-0" />
                        <span className="text-sm font-bold text-neutral-400 w-4">{String.fromCharCode(65 + i)}</span>
                        <input value={opt} onChange={e => updateOption(i, e.target.value)} className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Explanation</label>
                  <textarea value={editItem.explanation || ''} onChange={e => setEditItem((p: any) => ({ ...p, explanation: e.target.value }))} rows={2} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet resize-none" />
                </div>
              </div>
            )}

            {modalType === 's' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Scenario Title *</label>
                  <input value={editItem.scenario || ''} onChange={e => setEditItem((p: any) => ({ ...p, scenario: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Instruction</label>
                  <textarea value={editItem.instruction || ''} onChange={e => setEditItem((p: any) => ({ ...p, instruction: e.target.value }))} rows={2} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Marks</label>
                  <input type="number" value={editItem.marks || 15} onChange={e => setEditItem((p: any) => ({ ...p, marks: Number(e.target.value) }))} className="w-32 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Exchanges (JSON Array) *</label>
                  <p className="text-xs text-neutral-500 mb-2">Each item: {`{"role":"pilot","prompt":"...","expectedAnswer":"..."}`} or {`{"role":"atc","text":"..."}`}</p>
                  <textarea value={typeof editItem.exchanges === 'string' ? editItem.exchanges : JSON.stringify(editItem.exchanges, null, 2)} onChange={e => setEditItem((p: any) => ({ ...p, exchanges: e.target.value }))} rows={10} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet resize-y font-mono text-xs" />
                </div>
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
