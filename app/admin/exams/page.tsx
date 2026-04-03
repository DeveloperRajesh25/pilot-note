'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const SUBJECTS = ['Air Navigation', 'Meteorology', 'Air Regulations', 'Technical General', 'Technical Specific'];
const STATUSES = ['Upcoming', 'Active', 'Completed'];

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<any>({ title: '', subject: SUBJECTS[0], description: '', exam_date: '', exam_time: '10:00', duration: 120, total_questions: 100, fee: 499, status: 'Upcoming' });
  const [saving, setSaving] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/exams');
    const d = await res.json();
    setExams(d.exams ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const handleSave = async () => {
    if (!editExam.title || !editExam.subject) { alert('Title and subject required'); return; }
    setSaving(true);
    const isEdit = !!editExam.id;
    const url = isEdit ? `/api/admin/exams/${editExam.id}` : '/api/admin/exams';
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editExam) });
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

  const STATUS_COLOR: Record<string, string> = {
    Upcoming: 'bg-amber-500/20 text-amber-400',
    Active: 'bg-emerald-500/20 text-emerald-400',
    Completed: 'bg-neutral-700 text-neutral-400',
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div><h1 className="text-3xl font-black text-white mb-1">Pariksha Exams</h1><p className="text-neutral-400">{exams.length} exams</p></div>
        <button onClick={() => { setEditExam({ title: '', subject: SUBJECTS[0], description: '', exam_date: '', exam_time: '10:00', duration: 120, total_questions: 100, fee: 499, status: 'Upcoming' }); setShowModal(true); }}
          className="px-5 py-2.5 bg-violet text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-2">
          <span>+</span> New Exam
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-neutral-900 rounded-2xl border border-neutral-800 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {exams.map((ex) => (
            <div key={ex.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-black text-white">{ex.title}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${STATUS_COLOR[ex.status] ?? STATUS_COLOR.Upcoming}`}>{ex.status}</span>
                  </div>
                  <p className="text-violet text-xs font-bold uppercase tracking-wider mb-2">{ex.subject}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                    <span>📅 {ex.exam_date ? new Date(ex.exam_date).toLocaleDateString('en-IN') : 'TBD'}</span>
                    <span>⏰ {ex.exam_time}</span>
                    <span>⏱ {ex.duration} min</span>
                    <span>❓ {ex.total_questions} Qs</span>
                    <span>👥 {ex.registrations ?? 0} registered</span>
                    <span>💳 ₹{ex.fee}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/exams/${ex.id}`} className="px-4 py-2 bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-neutral-700 transition-colors">Questions →</Link>
                  <select value={ex.status} onChange={e => changeStatus(ex.id, e.target.value)} className="bg-neutral-800 border border-neutral-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => { setEditExam({ ...ex }); setShowModal(true); }} className="text-xs text-neutral-400 hover:text-white font-semibold">Edit</button>
                  <button onClick={() => handleDelete(ex.id)} className="text-xs text-rose-500 hover:text-rose-400 font-semibold">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {exams.length === 0 && <div className="text-center py-24 text-neutral-500">No exams yet.</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-xl my-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">{editExam.id ? 'Edit Exam' : 'New Exam'}</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Title *</label><input value={editExam.title || ''} onChange={e => setEditExam((p: any) => ({ ...p, title: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Subject</label>
                  <select value={editExam.subject} onChange={e => setEditExam((p: any) => ({ ...p, subject: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet">
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Status</label>
                  <select value={editExam.status} onChange={e => setEditExam((p: any) => ({ ...p, status: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Description</label><textarea value={editExam.description || ''} onChange={e => setEditExam((p: any) => ({ ...p, description: e.target.value }))} rows={2} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Exam Date</label><input type="date" value={editExam.exam_date || ''} onChange={e => setEditExam((p: any) => ({ ...p, exam_date: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" /></div>
                <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Exam Time (IST)</label><input type="time" value={editExam.exam_time || ''} onChange={e => setEditExam((p: any) => ({ ...p, exam_time: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Duration (min)</label><input type="number" value={editExam.duration || 120} onChange={e => setEditExam((p: any) => ({ ...p, duration: Number(e.target.value) }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" /></div>
                <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Questions</label><input type="number" value={editExam.total_questions || 100} onChange={e => setEditExam((p: any) => ({ ...p, total_questions: Number(e.target.value) }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" /></div>
                <div><label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Fee (₹)</label><input type="number" value={editExam.fee || 499} onChange={e => setEditExam((p: any) => ({ ...p, fee: Number(e.target.value) }))} className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-800">
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-violet text-white font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save Exam'}</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
