// Effective exam status — computed live from the synchronized window
// (start_at / end_at), with a fallback to the stored `status` column.
// The DB `status` value is a manual override: 'Cancelled' or 'Completed'
// set explicitly by an admin will win; otherwise we derive the phase from
// the timestamps so the UI never lags behind the wall clock.

export type ExamStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export interface ExamTimingInput {
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  exam_date?: string | null;
  exam_time?: string | null;
  duration?: number | null;
}

function parseIso(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

// Fallback for legacy rows that have exam_date + exam_time but no start_at.
// Treated as IST (Asia/Kolkata) since that's how the admin form has always
// captured them.
function legacyStartMs(exam: ExamTimingInput): number | null {
  if (!exam.exam_date) return null;
  const time = (exam.exam_time && exam.exam_time.length >= 4) ? exam.exam_time : '10:00';
  // Build "YYYY-MM-DDTHH:mm:00+05:30" so JS parses it as IST.
  const iso = `${exam.exam_date}T${time.length === 5 ? time : time.slice(0, 5)}:00+05:30`;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function computeExamStatus(
  exam: ExamTimingInput,
  now: number = Date.now(),
): ExamStatus {
  // Manual overrides win — admin explicitly marked it Cancelled / Completed.
  if (exam.status === 'Cancelled') return 'Cancelled';

  const start = parseIso(exam.start_at) ?? legacyStartMs(exam);
  if (start == null) {
    // No timing data — trust the stored status, default to Upcoming.
    const s = exam.status as ExamStatus | undefined;
    return s === 'Active' || s === 'Completed' || s === 'Cancelled' ? s : 'Upcoming';
  }

  const end =
    parseIso(exam.end_at) ??
    start + ((exam.duration ?? 120) * 60 * 1000);

  if (exam.status === 'Completed' && now >= start) return 'Completed';
  if (now < start) return 'Upcoming';
  if (now <= end) return 'Active';
  return 'Completed';
}

// Sentinel stored in `exams.status` when an admin closes registrations early
// (before the exam window opens). The exam lifecycle (Upcoming → Active →
// Completed) is still computed live from the timestamps; this value only gates
// whether new candidates may register.
export const REGISTRATION_CLOSED = 'RegistrationsClosed';

// Registration is open ONLY while the exam is still upcoming AND an admin has
// not manually closed it. The moment the window opens (Active) or the exam is
// completed/cancelled, registration is closed automatically — so the public
// "Register" button flips to "Registration closed" without any manual step.
export function isRegistrationOpen(
  exam: ExamTimingInput,
  now: number = Date.now(),
): boolean {
  if (exam.status === REGISTRATION_CLOSED) return false;
  return computeExamStatus(exam, now) === 'Upcoming';
}
