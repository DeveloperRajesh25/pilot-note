'use client';

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['Spatial Reasoning', 'Numerical Ability', 'Verbal Reasoning', 'Instrument Comprehension'];

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const EMPTY_Q: Partial<Question> = { category: CATEGORIES[0], question: '', options: ['', '', '', ''], correct: 0, explanation: '' };

export default function AdminAptitudePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState<Partial<Question>>(EMPTY_Q);
  const [saving, setSaving] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const url = filterCat === 'all' ? '/api/admin/questions' : `/api/admin/questions?category=${encodeURIComponent(filterCat)}`;
    const res = await fetch(url);
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setLoading(false);
  }, [filterCat]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const openCreate = () => { setEditQ({ ...EMPTY_Q, options: ['', '', '', ''] }); setShowModal(true); };
  const openEdit = (q: Question) => { setEditQ({ ...q, options: [...q.options] }); setShowModal(true); };

  const handleSave = async () => {
    if (!editQ.question || !editQ.options?.every(o => o.trim())) {
      alert('Fill in the question and all 4 options'); return;
    }
    setSaving(true);
    try {
      const isEdit = !!(editQ as Question).id;
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/admin/questions/${(editQ as Question).id}` : '/api/admin/questions';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editQ) });
      if (res.ok) { setShowModal(false); await fetchQuestions(); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    await fetchQuestions();
  };

  const updateOption = (i: number, val: string) => {
    setEditQ(prev => {
      const opts = [...(prev.options ?? ['', '', '', ''])];
      opts[i] = val;
      return { ...prev, options: opts };
    });
  };

  const catCounts = questions.reduce((acc: Record<string, number>, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1; return acc;
  }, {});

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Aptitude Questions</h1>
          <p className="text-neutral-400">{questions.length} questions</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-violet text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-2">
          <span>+</span> Add Question
        </button>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {CATEGORIES.map(cat => (
          <div key={cat} className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 text-center">
            <p className="text-2xl font-black text-white">{catCounts[cat] ?? 0}</p>
            <p className="text-xs text-neutral-500 font-medium mt-1">{cat}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterCat === cat ? 'bg-violet text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {loading && [...Array(5)].map((_, i) => <div key={i} className="h-16 bg-neutral-900 rounded-xl border border-neutral-800 animate-pulse" />)}
        {!loading && questions.map((q, idx) => (
          <div key={q.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 flex items-start gap-4 hover:border-neutral-700 transition-colors">
            <span className="text-lg font-black text-neutral-600 flex-shrink-0 w-8 text-center">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-violet">{q.category}</span>
              </div>
              <p className="text-sm text-white font-medium line-clamp-2">{q.question}</p>
              <div className="flex gap-3 mt-2">
                {q.options.map((opt, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded ${i === q.correct ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-neutral-800 text-neutral-500'}`}>
                    {String.fromCharCode(65 + i)}: {opt.substring(0, 20)}{opt.length > 20 ? '…' : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => openEdit(q)} className="text-xs text-neutral-400 hover:text-white font-semibold">Edit</button>
              <button onClick={() => handleDelete(q.id)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold">Delete</button>
            </div>
          </div>
        ))}
        {!loading && questions.length === 0 && <div className="text-center py-20 text-neutral-500">No questions in this category.</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-2xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">{(editQ as Question).id ? 'Edit Question' : 'New Question'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Category</label>
                <select value={editQ.category} onChange={e => setEditQ(p => ({ ...p, category: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Question *</label>
                <textarea value={editQ.question || ''} onChange={e => setEditQ(p => ({ ...p, question: e.target.value }))} rows={3} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Options (mark correct with radio)</label>
                <div className="space-y-2">
                  {(editQ.options ?? ['', '', '', '']).map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="radio" name="correct" checked={editQ.correct === i} onChange={() => setEditQ(p => ({ ...p, correct: i }))} className="w-4 h-4 accent-violet flex-shrink-0" />
                      <span className="text-sm font-bold text-neutral-400 w-4">{String.fromCharCode(65 + i)}</span>
                      <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Explanation</label>
                <textarea value={editQ.explanation || ''} onChange={e => setEditQ(p => ({ ...p, explanation: e.target.value }))} rows={2} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet transition-colors resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-800">
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-violet text-white font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Question'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-700 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
