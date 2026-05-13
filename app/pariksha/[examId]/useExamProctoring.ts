'use client';

import { useEffect, useRef } from 'react';
import type { ViolationType } from '@/lib/types';

interface ProctoringOptions {
  /**
   * Fires for every violation that actually flushes (after dedupe). Use it to
   * surface a toast or update an in-page counter. The hook ALWAYS POSTs to the
   * /violations endpoint — onViolation is for UI only.
   */
  onViolation?: (event: { type: ViolationType; message: string }) => void;
  /** Set false to disarm the hook (e.g. before/after the live phase). */
  enabled?: boolean;
}

const HUMAN_MESSAGE: Record<ViolationType, string> = {
  tab_hidden: 'Tab switch detected — flagged to administrators.',
  window_blur: 'Window lost focus — flagged to administrators.',
  fullscreen_exit: 'Fullscreen exited — flagged to administrators.',
  right_click: 'Right-click is disabled during the exam.',
  devtools_key: 'Developer tool shortcut blocked — flagged to administrators.',
  clipboard: 'Copy/paste is disabled during the exam.',
};

const COOLDOWN_MS = 3_000;

export function useExamProctoring(examId: string, options: ProctoringOptions = {}) {
  const { onViolation, enabled = true } = options;
  // Refs avoid re-binding listeners when the callback identity changes each render.
  const cbRef = useRef(onViolation);
  useEffect(() => { cbRef.current = onViolation; }, [onViolation]);

  const cooldown = useRef<Map<ViolationType, number>>(new Map());

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const fire = (type: ViolationType, meta?: Record<string, unknown>) => {
      const now = Date.now();
      const last = cooldown.current.get(type) ?? 0;
      if (now - last < COOLDOWN_MS) return;
      cooldown.current.set(type, now);

      cbRef.current?.({ type, message: HUMAN_MESSAGE[type] });

      // keepalive lets the POST complete even if the tab is closing.
      try {
        fetch(`/api/exams/${examId}/violations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, meta }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Some browsers throw synchronously inside beforeunload — ignore.
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) fire('tab_hidden');
    };
    const onBlur = () => fire('window_blur');
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) fire('fullscreen_exit');
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      fire('right_click');
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      fire('clipboard', { kind: 'copy' });
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      fire('clipboard', { kind: 'paste' });
    };
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      fire('clipboard', { kind: 'cut' });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      // F12 — devtools
      if (k === 'F12') { e.preventDefault(); fire('devtools_key', { key: 'F12' }); return; }
      // Ctrl/Cmd+Shift+I / J / C — devtools
      if (ctrl && shift && (k === 'I' || k === 'i' || k === 'J' || k === 'j' || k === 'C' || k === 'c')) {
        e.preventDefault(); fire('devtools_key', { key: `Ctrl+Shift+${k.toUpperCase()}` }); return;
      }
      // Ctrl+U — view source
      if (ctrl && (k === 'U' || k === 'u')) { e.preventDefault(); fire('devtools_key', { key: 'Ctrl+U' }); return; }
      // Ctrl+P — print (could be used to capture page)
      if (ctrl && (k === 'P' || k === 'p')) { e.preventDefault(); fire('devtools_key', { key: 'Ctrl+P' }); return; }
      // Ctrl+S — save page
      if (ctrl && (k === 'S' || k === 's')) { e.preventDefault(); fire('devtools_key', { key: 'Ctrl+S' }); return; }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [examId, enabled]);
}

/** Imperatively requests fullscreen — must be called from a user gesture. */
export async function requestExamFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (document.fullscreenElement) return true;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch {
    return false;
  }
}
