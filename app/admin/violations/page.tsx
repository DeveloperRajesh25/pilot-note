'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ViolationEvent, ViolationType } from '@/lib/types';

interface ViolationRow {
  attempt_id: string;
  user_id: string;
  exam_id: string;
  exam_title: string | null;
  exam_subject: string | null;
  user_email: string | null;
  user_name: string | null;
  total: number;
  summary: Partial<Record<ViolationType, number>>;
  last_at: string | null;
  auto_submitted: boolean;
  started_at: string;
  submitted_at: string | null;
  violations: ViolationEvent[];
}

const VIOLATION_LABEL: Record<ViolationType, string> = {
  tab_hidden: 'Tab switch',
  window_blur: 'Lost focus',
  fullscreen_exit: 'Exited fullscreen',
  right_click: 'Right-click',
  devtools_key: 'Dev-tools shortcut',
  clipboard: 'Copy / paste',
};

const VIOLATION_ICON: Record<ViolationType, string> = {
  tab_hidden: '🪟',
  window_blur: '👁',
  fullscreen_exit: '⛶',
  right_click: '🖱',
  devtools_key: '⌨',
  clipboard: '📋',
};

function severityBand(count: number) {
  if (count >= 10) return { tone: 'bg-rose-50 text-rose-700 border-rose-200', label: 'High' };
  if (count >= 4) return { tone: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Medium' };
  return { tone: 'bg-neutral-100 text-neutral-600 border-neutral-200', label: 'Low' };
}

export default function AdminViolationsPage() {
  const [rows, setRows] = useState<ViolationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState<string>('all');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/violations', { cache: 'no-store' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error ?? `Failed to load (HTTP ${res.status})`);
        setRows([]);
      } else {
        setRows(d.rows ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const exams = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.exam_id, r.exam_title ?? r.exam_id));
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (examFilter !== 'all' && r.exam_id !== examFilter) return false;
      if (!q) return true;
      return (
        (r.user_email ?? '').toLowerCase().includes(q) ||
        (r.user_name ?? '').toLowerCase().includes(q) ||
        (r.exam_title ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, examFilter]);

  const totals = useMemo(() => {
    const t: Partial<Record<ViolationType, number>> = {};
    let attempts = 0;
    rows.forEach((r) => {
      attempts += 1;
      Object.entries(r.summary).forEach(([k, n]) => {
        const key = k as ViolationType;
        t[key] = (t[key] ?? 0) + (n ?? 0);
      });
    });
    return { attempts, perType: t };
  }, [rows]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900 mb-1">Proctoring Violations</h1>
        <p className="text-neutral-500">
          {loading ? 'Loading…' : `${totals.attempts} flagged attempt${totals.attempts === 1 ? '' : 's'} across all Pariksha exams`}
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {(Object.keys(VIOLATION_LABEL) as ViolationType[]).map((type) => (
          <div key={type} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg leading-none">{VIOLATION_ICON[type]}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">{VIOLATION_LABEL[type]}</span>
            </div>
            <p className="text-2xl font-black text-neutral-900">{totals.perType[type] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user email, name, or exam…"
          className="flex-1 min-w-[200px] bg-white border border-neutral-200 text-neutral-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-400"
        />
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="bg-white border border-neutral-200 text-neutral-900 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-neutral-400"
        >
          <option value="all">All exams</option>
          {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
        </select>
        <button
          onClick={() => void fetchRows()}
          className="px-4 py-2 bg-neutral-100 text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
          <span className="font-bold">Couldn&apos;t load violations: </span>{error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-neutral-100 rounded-2xl border border-neutral-200 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-neutral-500 bg-white rounded-2xl border border-neutral-200">
          {rows.length === 0
            ? 'No proctoring flags yet — clean run so far.'
            : 'No flagged attempts match the current filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const sev = severityBand(r.total);
            const isOpen = expanded === r.attempt_id;
            return (
              <div key={r.attempt_id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.attempt_id)}
                  className="w-full text-left p-5 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span className="font-bold text-neutral-900 truncate">{r.user_name || r.user_email || r.user_id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${sev.tone}`}>
                          {sev.label} · {r.total} flag{r.total === 1 ? '' : 's'}
                        </span>
                        {r.auto_submitted && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                            Auto-submitted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mb-2">
                        {r.user_email ?? '—'} · {r.exam_title ?? r.exam_id}{r.exam_subject ? ` · ${r.exam_subject}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(r.summary) as [ViolationType, number][]).map(([type, count]) => (
                          <span key={type} className="px-2 py-0.5 text-[11px] rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                            {VIOLATION_ICON[type]} {VIOLATION_LABEL[type]} × {count}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[11px] text-neutral-500">
                        Last: {r.last_at ? new Date(r.last_at).toLocaleString('en-IN') : '—'}
                      </span>
                      <Link
                        href={`/admin/exams/${r.exam_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-neutral-900 hover:text-emerald-700"
                      >
                        Open exam →
                      </Link>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                        {isOpen ? 'Hide timeline' : 'Show timeline'}
                      </span>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-neutral-200 bg-neutral-50/60 p-5">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold mb-3">
                      Event timeline ({r.violations.length})
                    </p>
                    <ol className="space-y-1.5">
                      {r.violations.map((v, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs">
                          <span className="text-neutral-400 font-mono shrink-0 w-6 text-right">{i + 1}.</span>
                          <span className="shrink-0">{VIOLATION_ICON[v.type]}</span>
                          <span className="font-medium text-neutral-900 shrink-0">{VIOLATION_LABEL[v.type]}</span>
                          <span className="text-neutral-500 font-mono">{new Date(v.at).toLocaleString('en-IN')}</span>
                          {v.meta && Object.keys(v.meta).length > 0 && (
                            <span className="text-neutral-400 font-mono truncate">{JSON.stringify(v.meta)}</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
