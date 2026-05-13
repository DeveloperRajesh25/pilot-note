'use client';

import React, { useEffect, useRef } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  onConfirm,
  onCancel,
  busy,
}: DialogProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  // Lock body scroll while open + focus confirm button.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => confirmRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  // Esc cancels.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    confirmTone === 'danger'
      ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
      : 'bg-neutral-900 text-white border-neutral-900 hover:bg-black';

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-neutral-200 shadow-[0_24px_60px_-20px_rgba(10,10,10,0.45)] p-8 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="font-display text-2xl text-neutral-900 mb-3 tracking-tight">
          {title}
        </h2>
        {description && (
          <div className="text-neutral-600 text-sm leading-relaxed mb-8">{description}</div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900 hover:text-neutral-900 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
