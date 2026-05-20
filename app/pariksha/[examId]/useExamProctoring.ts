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

// Long-press threshold for touch context menu blocking.
const LONG_PRESS_MS = 500;

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
      // PrintScreen — Windows/Linux. Note: this fires on keyup on most browsers
      // but we listen to both. We can't actually stop the OS-level screenshot,
      // but we can log it and warn.
      if (k === 'PrintScreen' || k === 'Print') {
        fire('devtools_key', { key: 'PrintScreen' });
        return;
      }
      // F12 — devtools
      if (k === 'F12') { e.preventDefault(); fire('devtools_key', { key: 'F12' }); return; }
      // Ctrl/Cmd+Shift+I / J / C — devtools
      if (ctrl && shift && (k === 'I' || k === 'i' || k === 'J' || k === 'j' || k === 'C' || k === 'c')) {
        e.preventDefault(); fire('devtools_key', { key: `Ctrl+Shift+${k.toUpperCase()}` }); return;
      }
      // macOS screenshot: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (ctrl && shift && (k === '3' || k === '4' || k === '5')) {
        fire('devtools_key', { key: `Cmd+Shift+${k}` });
        return;
      }
      // Ctrl+U — view source
      if (ctrl && (k === 'U' || k === 'u')) { e.preventDefault(); fire('devtools_key', { key: 'Ctrl+U' }); return; }
      // Ctrl+P — print (could be used to capture page)
      if (ctrl && (k === 'P' || k === 'p')) { e.preventDefault(); fire('devtools_key', { key: 'Ctrl+P' }); return; }
      // Ctrl+S — save page
      if (ctrl && (k === 'S' || k === 's')) { e.preventDefault(); fire('devtools_key', { key: 'Ctrl+S' }); return; }
      // Ctrl+A — select all (lets the user copy)
      if (ctrl && (k === 'A' || k === 'a')) { e.preventDefault(); fire('devtools_key', { key: 'Ctrl+A' }); return; }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // Many browsers only fire PrintScreen on keyup, and the screenshot has
      // already happened. We log it for visibility.
      if (e.key === 'PrintScreen' || e.key === 'Print') {
        fire('devtools_key', { key: 'PrintScreen (keyup)' });
      }
    };

    // Touch long-press → triggers the context menu / iOS Share sheet. Cancel it.
    let touchTimer: ReturnType<typeof setTimeout> | null = null;
    const onTouchStart = () => {
      if (touchTimer) clearTimeout(touchTimer);
      touchTimer = setTimeout(() => {
        fire('right_click', { source: 'touch_long_press' });
      }, LONG_PRESS_MS);
    };
    const onTouchEnd = () => {
      if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    };
    // Cancel the long-press timer when the user scrolls so we don't fire mid-scroll.
    const onTouchMove = () => {
      if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    };
    const onSelectStart = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => { e.preventDefault(); };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('dragstart', onDragStart);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('dragstart', onDragStart);
      if (touchTimer) clearTimeout(touchTimer);
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
