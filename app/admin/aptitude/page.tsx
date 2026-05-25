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

interface BulkRow {
  category: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const EMPTY_Q: Partial<Question> = { category: CATEGORIES[0], question: '', options: ['', '', '', ''], correct: 0, explanation: '' };

const CSV_TEMPLATE = `category,question,option_a,option_b,option_c,option_d,correct_answer,explanation
"Spatial Reasoning","Which shape comes next in the sequence?","Triangle","Square","Pentagon","Hexagon","C","The sides increase by one each step"
"Numerical Ability","What is 15% of 200?","20","25","30","35","C","15% of 200 = 30"
"Verbal Reasoning","Choose the synonym of 'rapid'","slow","quick","heavy","late","B","Rapid means fast/quick"
"Instrument Comprehension","If the artificial horizon shows a left bank, the aircraft is...","Climbing","Descending","Banking left","Banking right","C","Artificial horizon indicates roll attitude"`;

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
  const validCats = new Set(CATEGORIES);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 7) {
      errors.push(`Row ${i + 1}: expected 7+ columns (category, question, option_a, b, c, d, correct_answer, [explanation])`);
      continue;
    }
    const [category, question, opt_a, opt_b, opt_c, opt_d, correct_letter, explanation = ''] = cols.map(c => c.trim());
    if (!validCats.has(category)) {
      errors.push(`Row ${i + 1}: category must be one of: ${CATEGORIES.join(', ')}`);
      continue;
    }
    if (!question) { errors.push(`Row ${i + 1}: question is empty`); continue; }
    const options = [opt_a, opt_b, opt_c, opt_d];
    if (options.some(o => !o)) { errors.push(`Row ${i + 1}: all four options must be filled`); continue; }
    const correct = letterIdx[correct_letter.toUpperCase()];
    if (correct === undefined) { errors.push(`Row ${i + 1}: correct_answer must be A, B, C, or D`); continue; }
    rows.push({ category, question, options, correct, explanation });
  }
  return { rows, errors };
}

export default function AdminAptitudePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState<Partial<Question>>(EMPTY_Q);
  const [saving, setSaving] = useState(false);

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkParsed, setBulkParsed] = useState<BulkRow[] | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ inserted: number; errors?: string[] } | null>(null);

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

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aptitude-questions-template.csv';
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
      const res = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: bulkParsed }),
      });
      const d = await res.json();
      setBulkResult(d);
      if (res.ok) { await fetchQuestions(); setBulkParsed(null); setBulkErrors([]); }
    } catch {
      setBulkResult({ inserted: 0, errors: ['Network error'] });
    } finally {
      setBulkUploading(false);
    }
  };

  const catCounts = questions.reduce((acc: Record<string, number>, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1; return acc;
  }, {});

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">Aptitude Questions</h1>
          <p className="text-neutral-500">{questions.length} questions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowBulkModal(true); setBulkParsed(null); setBulkErrors([]); setBulkResult(null); }}
            className="px-5 py-2.5 bg-neutral-100 text-neutral-900 font-bold text-sm rounded-xl hover:bg-neutral-200 transition-colors"
          >
            ↑ Bulk Upload CSV
          </button>
          <button onClick={openCreate} className="px-5 py-2.5 bg-neutral-900 text-white font-bold text-sm rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2">
            <span>+</span> Add Question
          </button>
        </div>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {CATEGORIES.map(cat => (
          <div key={cat} className="bg-white rounded-xl border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-black text-neutral-900">{catCounts[cat] ?? 0}</p>
            <p className="text-xs text-neutral-500 font-medium mt-1">{cat}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterCat === cat ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'}`}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {loading && [...Array(5)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded-xl border border-neutral-200 animate-pulse" />)}
        {!loading && questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start gap-4 hover:border-neutral-300 hover:shadow-sm transition-all">
            <span className="text-lg font-black text-neutral-400 flex-shrink-0 w-8 text-center">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-600">{q.category}</span>
              </div>
              <p className="text-sm text-neutral-900 font-medium line-clamp-2">{q.question}</p>
              <div className="flex gap-3 mt-2">
                {q.options.map((opt, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i === q.correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                    {String.fromCharCode(65 + i)}: {opt.substring(0, 20)}{opt.length > 20 ? '…' : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => openEdit(q)} className="text-xs text-neutral-500 hover:text-neutral-900 font-semibold">Edit</button>
              <button onClick={() => handleDelete(q.id)} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">Delete</button>
            </div>
          </div>
        ))}
        {!loading && questions.length === 0 && <div className="text-center py-20 text-neutral-500">No questions in this category.</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-2xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">{(editQ as Question).id ? 'Edit Question' : 'New Question'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl">&times;</button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Category</label>
                <select value={editQ.category} onChange={e => setEditQ(p => ({ ...p, category: e.target.value }))} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 transition-colors">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Question *</label>
                <textarea value={editQ.question || ''} onChange={e => setEditQ(p => ({ ...p, question: e.target.value }))} rows={3} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 transition-colors resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Options (mark correct with radio)</label>
                <div className="space-y-2">
                  {(editQ.options ?? ['', '', '', '']).map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="radio" name="correct" checked={editQ.correct === i} onChange={() => setEditQ(p => ({ ...p, correct: i }))} className="w-4 h-4 accent-neutral-900 flex-shrink-0" />
                      <span className="text-sm font-bold text-neutral-500 w-4">{String.fromCharCode(65 + i)}</span>
                      <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} className="flex-1 bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Explanation</label>
                <textarea value={editQ.explanation || ''} onChange={e => setEditQ(p => ({ ...p, explanation: e.target.value }))} rows={2} className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 transition-colors resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-200">
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Question'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk upload modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white border border-neutral-200 shadow-2xl rounded-3xl p-8 w-full max-w-3xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900">Bulk Upload Aptitude Questions</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-neutral-400 hover:text-neutral-900 text-2xl leading-none">&times;</button>
            </div>

            <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-sm font-bold text-neutral-700 mb-2">CSV Format</p>
              <p className="text-xs text-neutral-500 mb-1">
                Columns: <code className="bg-neutral-200 px-1.5 py-0.5 rounded font-mono">category, question, option_a, option_b, option_c, option_d, correct_answer, explanation</code>
              </p>
              <p className="text-xs text-neutral-500 mb-1">
                <strong>category</strong> must be one of: {CATEGORIES.map(c => <code key={c} className="bg-neutral-200 px-1 mx-0.5 rounded text-[10px] font-mono">{c}</code>)}
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
                      <p className="text-emerald-600 font-bold mb-1">{q.category}</p>
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
