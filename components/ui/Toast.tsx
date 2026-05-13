'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ToastTone = 'info' | 'warn' | 'error' | 'success';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  push: (tone: ToastTone, message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No-op outside provider so dynamic-imported components don't crash during SSR.
    const noop = () => {};
    return { push: noop, info: noop, warn: noop, error: noop, success: noop };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value: ToastContextValue = {
    push,
    info: (m) => push('info', m),
    warn: (m) => push('warn', m),
    error: (m) => push('error', m),
    success: (m) => push('success', m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  // Render only on client.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="fixed top-6 right-6 z-300 flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto text-left px-5 py-3.5 rounded-2xl border shadow-[0_12px_32px_-12px_rgba(10,10,10,0.25)] text-sm font-medium animate-fade-up ${toneClass(t.tone)}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}

function toneClass(tone: ToastTone): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'warn':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'error':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'info':
    default:
      return 'bg-neutral-900 text-white border-neutral-900';
  }
}
