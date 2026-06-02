'use client';

import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

const DEFAULT_ITEMS = [
  'DGCA CPL & ATPL',
  'Air Navigation',
  'Meteorology',
  'Aviation Met',
  'Air Regulations',
  'Technical General',
  'COMPASS Aptitude',
  'Class 1 Medical',
  'Pariksha National Mocks',
  'Phraseology',
];

export default function MarqueeSettingsPage() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/marquee')
      .then((r) => r.json())
      .then((data) => setItems(data.items?.length ? data.items : DEFAULT_ITEMS))
      .catch(() => setItems(DEFAULT_ITEMS))
      .finally(() => setLoading(false));
  }, []);

  const update = (idx: number, val: string) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? val : item)));
  };

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems((prev) => [...prev, '']);
  };

  const save = async () => {
    const clean = items.map((s) => s.trim()).filter(Boolean);
    if (clean.length === 0) {
      setError('Add at least one marquee item.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/marquee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setItems(data.items);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setItems(next);
    setDragIdx(idx);
  };
  const onDragEnd = () => setDragIdx(null);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-neutral-900 mb-1">Marquee Settings</h1>
        <p className="text-neutral-500 text-sm">
          Edit the scrolling text strip shown below the hero section on the homepage. Drag to reorder.
        </p>
      </div>

      {/* Preview */}
      <div className="mb-8 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 overflow-hidden">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 font-medium mb-3">Live preview</p>
        <div className="flex items-center gap-6 overflow-x-auto pb-1 scrollbar-none">
          {items.filter(Boolean).map((item, i) => (
            <span key={i} className="flex items-center gap-6 text-sm font-semibold text-neutral-800 whitespace-nowrap">
              {item}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-neutral-500 py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-3 bg-white border rounded-xl px-3 py-2 group transition-all ${
                dragIdx === idx ? 'border-emerald-400 shadow-md' : 'border-neutral-200'
              }`}
            >
              <GripVertical className="w-4 h-4 text-neutral-300 cursor-grab shrink-0" />
              <input
                type="text"
                value={item}
                onChange={(e) => update(idx, e.target.value)}
                className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
                placeholder="Marquee item text…"
              />
              <button
                onClick={() => remove(idx)}
                className="text-neutral-300 hover:text-rose-500 transition-colors shrink-0"
                aria-label="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-all"
        >
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Saved!
          </span>
        )}
      </div>
    </div>
  );
}
