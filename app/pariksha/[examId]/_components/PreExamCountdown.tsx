'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { computeDrift, remainingSeconds, formatLongCountdown } from '@/lib/time';
import type { ExamPhase } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ExamMeta {
  title: string;
  subject: string;
  duration: number;
  total_questions: number;
  pass_score: number;
}

interface Props {
  examId: string;
  exam: ExamMeta;
  startAt: string;            // ISO
  endAt: string | null;       // ISO
  serverNowMs: number;
  /** Called when the server-reported phase flips to `live` (or `post_exam`). */
  onPhaseChange: (phase: ExamPhase) => void;
}

export function PreExamCountdown({ examId, exam, startAt, endAt, serverNowMs, onPhaseChange }: Props) {
  const driftRef = useRef(computeDrift(serverNowMs));
  const startMs = useMemo(() => new Date(startAt).getTime(), [startAt]);
  const [secsLeft, setSecsLeft] = useState(() =>
    Math.max(0, Math.floor((startMs - serverNowMs) / 1000))
  );

  // 1Hz countdown driven off the latest drift estimate. When we hit zero, flip phase.
  useEffect(() => {
    const tick = () => {
      const left = remainingSeconds(startMs, driftRef.current);
      setSecsLeft(left);
      if (left <= 0) onPhaseChange('live');
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [startMs, onPhaseChange]);

  // Poll the server every 15s so we flip into `live` even if device clock drifts.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/attempt`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: { phase?: ExamPhase; server_now?: number } = await res.json();
        if (cancelled) return;
        if (typeof data.server_now === 'number') {
          driftRef.current = computeDrift(data.server_now);
        }
        if (data.phase && data.phase !== 'pre_exam') {
          onPhaseChange(data.phase);
        }
      } catch {
        // Network blip — keep ticking on local drift estimate.
      }
    };
    const i = setInterval(poll, 15_000);
    return () => { cancelled = true; clearInterval(i); };
  }, [examId, onPhaseChange]);

  const t = formatLongCountdown(secsLeft);

  const startLocal = new Date(startAt).toLocaleString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <main className="grow pt-28 sm:pt-32 pb-20 sm:pb-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
            <span className="w-6 h-px bg-neutral-900" /> Pariksha · {exam.subject}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl leading-[1.02] sm:leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-4 sm:mb-6">
            {exam.title}
          </h1>
          <p className="text-neutral-600 text-base sm:text-lg max-w-2xl mb-8 sm:mb-12 leading-relaxed">
            Your seat is reserved. The exam unlocks for everyone — at the same moment, nationwide.
          </p>

          <div className="border border-neutral-200 rounded-3xl p-5 sm:p-8 md:p-12 bg-white">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-5 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" /> Exam opens in
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-8 mb-8 sm:mb-10">
              <TimeUnit value={t.days} label="Days" />
              <TimeUnit value={t.hours} label="Hours" />
              <TimeUnit value={t.minutes} label="Minutes" />
              <TimeUnit value={t.seconds} label="Seconds" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 border-t border-neutral-200 pt-6 sm:pt-8">
              <Detail label="Starts at" value={startLocal} />
              <Detail label="Duration" value={`${exam.duration} min · ${exam.total_questions} questions`} />
              <Detail label="Pass score" value={`${exam.pass_score}%`} />
              <Detail label="Format" value="Multiple choice · single answer" />
            </div>
          </div>

          <div className="mt-6 sm:mt-10 border border-neutral-200 rounded-3xl p-5 sm:p-8 bg-neutral-50">
            <h3 className="font-display text-lg sm:text-xl text-neutral-900 mb-3">Before you begin</h3>
            <ul className="space-y-2 text-[13.5px] sm:text-sm text-neutral-700 leading-relaxed list-disc pl-5">
              <li>Use a quiet space and a stable internet connection.</li>
              <li>The exam runs in fullscreen. Leaving fullscreen, switching tabs, copying content, or taking screenshots is logged and visible to administrators.</li>
              <li>You can leave and re-enter, but the global clock keeps running.</li>
              <li>At the end time, your attempt is auto-submitted with whatever is saved.</li>
            </ul>
          </div>

          <div className="mt-10 flex items-center gap-3 text-neutral-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for the exam window to open…
          </div>

          {endAt && (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
              Ends · {new Date(endAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl sm:text-5xl md:text-6xl text-neutral-900 leading-none tracking-tight tabular-nums">
        {value.toString().padStart(2, '0')}
      </p>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-neutral-400 mt-2 sm:mt-3 font-medium">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mb-1.5 font-medium">{label}</p>
      <p className="text-sm text-neutral-900 font-medium">{value}</p>
    </div>
  );
}
