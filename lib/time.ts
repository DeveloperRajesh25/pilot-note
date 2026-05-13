/**
 * Drift-corrected clock utilities for synchronized exam timing.
 * The server is the source of truth — clients compute a `drift` offset
 * against `Date.now()` once on mount and use it for all absolute-time math.
 */

export interface ServerTimeRef {
  /** Server-reported epoch ms minus local Date.now() at the moment we measured. */
  drift: number;
}

export function computeDrift(serverEpochMs: number, localNowMs = Date.now()): ServerTimeRef {
  return { drift: serverEpochMs - localNowMs };
}

export function serverNow(ref: ServerTimeRef): number {
  return Date.now() + ref.drift;
}

export function remainingSeconds(targetEpochMs: number, ref: ServerTimeRef): number {
  return Math.max(0, Math.floor((targetEpochMs - serverNow(ref)) / 1000));
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

/**
 * Long-form countdown (days/hours/minutes) for the pre-exam waiting room.
 */
export function formatLongCountdown(seconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const s = Math.max(0, Math.floor(seconds));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}
