'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RTR_CONFIG } from '@/app/constants/data';
import { Button } from '@/components/ui/Button';
import type { RTRChartContext, RTRChartQuestion, RTRSubPart, RTRBlank } from '@/lib/types';

interface Part1Question {
  id: string;
  test_id?: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string | null;
}

interface Part2Scenario {
  id: string;
  test_id?: string;
  marks: number;
  scenario: string;
  instruction?: string | null;
  chart_context?: RTRChartContext | null;
  questions?: RTRChartQuestion[] | null;
}

interface RTRTestSummary { id: string; title: string }
type ExamMode = 'practice' | 'simulate';

// --- Utilities ---

const calculateSimilarity = (studentText: string, expectedText: string) => {
  if (!studentText || !studentText.trim()) return 0;
  const normalize = (str: string) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ").replace(/\s{2,}/g, " ").trim();
  const studentWords = normalize(studentText).split(" ");
  const expectedWords = normalize(expectedText).split(" ");
  if (expectedWords.length === 0) return 100;
  let matchCount = 0;
  const studentWordsSet = new Set(studentWords);
  expectedWords.forEach(word => { if (studentWordsSet.has(word)) matchCount++; });
  return Math.min(100, (matchCount / expectedWords.length) * 100);
};

const NATO_PHONETIC: Record<string, string> = {
  'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliet',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu'
};

const ICAO_NUMBERS: Record<string, string> = {
  '0': 'zero', '1': 'wun', '2': 'too', '3': 'tree',
  '4': 'fow-er', '5': 'fife', '6': 'six', '7': 'seven',
  '8': 'ait', '9': 'niner'
};

const RT_WORDS = new Set(['ROGER', 'WILCO', 'AFFIRM', 'NEGATIVE', 'MAYDAY', 'PAN', 'CLEARED', 'TAXI', 'HOLD', 'SHORT', 'POSITION', 'LINE', 'RUNWAY', 'WIND', 'KNOTS', 'DEGREES', 'CONTACT', 'TOWER', 'GROUND', 'APPROACH', 'DEPARTURE', 'RADAR', 'SQUAWK', 'ALTITUDE', 'FLIGHT', 'LEVEL', 'CLIMB', 'DESCEND', 'MAINTAIN', 'TURN', 'LEFT', 'RIGHT', 'HEADING', 'PROCEED', 'DIRECT', 'REPORT', 'READY', 'TAKEOFF', 'LANDING', 'FINAL', 'BASE', 'DOWNWIND', 'CROSSWIND', 'CIRCUIT', 'PATTERN', 'OVERHEAD', 'FEET', 'METRES', 'MILES', 'NAUTICAL', 'VISIBILITY', 'ATIS', 'INFORMATION', 'STANDBY', 'GO', 'AHEAD', 'QNH', 'QFE', 'QFF', 'QNE', 'SAY', 'AGAIN', 'CORRECTION', 'DISREGARD', 'ACKNOWLEDGE', 'COPY', 'READ', 'BACK', 'OVER', 'OUT', 'BREAK', 'REQUEST', 'PERMISSION', 'APPROVED', 'UNABLE', 'EXPECT', 'TRAFFIC', 'NO', 'DELAY', 'IMMEDIATELY', 'EXPEDITE', 'UP', 'WAIT', 'AND', 'FOR', 'TO', 'THE', 'AT', 'ON', 'FROM', 'WITH', 'VIA', 'IS', 'ARE', 'AFTER', 'BEFORE', 'ABOVE', 'BELOW', 'THOUSAND', 'HUNDRED', 'STOP', 'GOOD', 'MORNING', 'EVENING', 'AFTERNOON', 'DAY', 'HEAVY', 'SUPER', 'LIGHT', 'MEDIUM', 'CAUTION', 'WAKE', 'TURBULENCE', 'CLOUD', 'CLEAR', 'ESTABLISHED', 'LOCALISER', 'GLIDESLOPE', 'MISSED', 'CONTINUE', 'ORBIT', 'EXTEND', 'REDUCE', 'SPEED', 'IDENTIFIED', 'NOT', 'AVAILABLE', 'CLOSED', 'OPEN', 'ENTER', 'LEAVE', 'JOIN', 'CROSS', 'BEHIND', 'FOLLOW', 'PASSING', 'REACHING', 'VACATE', 'BACKTRACK']);

function convertToRTPhraseology(text: string) {
  return text.split(/\s+/).map(word => {
    const punctMatch = word.match(/^(.+?)([,.\-;:!?]*)$/);
    const core = punctMatch ? punctMatch[1] : word;
    const trailing = punctMatch ? punctMatch[2] : '';
    let converted = core;

    if (/^(FL|RW|RWY|SQ|HDG|ALT)(\d+)$/i.test(core)) {
      const match = core.match(/^(FL|RW|RWY|SQ|HDG|ALT)(\d+)$/i)!;
      const prefixes: Record<string, string> = { 'FL': 'Flight Level', 'RW': 'Runway', 'RWY': 'Runway', 'SQ': 'Squawk', 'HDG': 'Heading', 'ALT': 'Altitude' };
      converted = (prefixes[match[1].toUpperCase()] || match[1]) + ' ' + match[2].split('').map(d => ICAO_NUMBERS[d] || d).join(' ');
    } else if (RT_WORDS.has(core.toUpperCase())) {
      converted = core;
    } else if (/^\d+\.\d+$/.test(core)) {
        converted = core.split('.').map(p => p.split('').map(d => ICAO_NUMBERS[d] || d).join(' ')).join(' decimal ');
    } else if (/^\d+$/.test(core)) {
        converted = core.split('').map(d => ICAO_NUMBERS[d] || d).join(' ');
    } else if (/^[A-Z0-9]+-[A-Z0-9]+$/i.test(core)) {
        converted = core.split('-').map(p => p.toUpperCase().split('').map(ch => NATO_PHONETIC[ch] || ICAO_NUMBERS[ch] || ch).join(' ')).join(', ');
    } else {
        converted = core;
    }
    return converted + trailing;
  }).join(' ');
}

// Note + 5 instructions are constant on every chart paper.
const FIXED_NOTE_POINTS = [
  'Answer all situations/questions in ascending order',
  'Use hypothetical data of procedural control only. Usage of Radials and DME distances is recommended.',
  'For messages that require to be transmitted at specific time, candidate should write that specific time against question No on answer sheet',
  'Continue answering question till you are told to "Go to next question"',
  'Usage of Aviation Language and prescribed Phraseologies is mandatory.',
];

// Fixed labels rendered on every chart in the same positions as the printed paper.
const HEADER_ROWS: { left: { key: keyof RTRChartContext; label: string }; mid?: { key: keyof RTRChartContext; label: string }; right?: { key: keyof RTRChartContext; label: string } }[] = [
  { left: { key: 'aircraft_id', label: 'Aircraft Identification' }, mid: { key: 'flight_rules', label: 'Flight Rules' }, right: { key: 'flight_type', label: 'Type of Flight' } },
  { left: { key: 'type_aircraft', label: 'Type of Aircraft' }, mid: { key: 'wake_turb_cat', label: 'Wake Turbulence CAT' }, right: { key: 'equipment', label: 'Equipment' } },
  { left: { key: 'departure', label: 'Departure Aerodrome' }, mid: { key: 'time', label: 'Time' }, right: { key: 'level', label: 'Level' } },
  { left: { key: 'route', label: 'Route' } },
  { left: { key: 'destination', label: 'Destination Aerodrome' }, mid: { key: 'alternate', label: 'Alternate Aerodrome' } },
  { left: { key: 'other_info', label: 'Other Information' } },
];

// Flatten all sub-parts across all scenarios into an ordered step list.
interface Step {
  scenarioIdx: number;
  questionIdx: number;
  subPartIdx: number;
  question: RTRChartQuestion;
  subPart: RTRSubPart;
  numberLabel: string; // "1a", "3", etc.
}

function buildSteps(scenarios: Part2Scenario[]): Step[] {
  const steps: Step[] = [];
  scenarios.forEach((sc, si) => {
    (sc.questions ?? []).forEach((q, qi) => {
      q.subParts.forEach((sp, spi) => {
        const onlyOne = q.subParts.length === 1 && (!sp.label || sp.label.trim() === '');
        const numberLabel = onlyOne ? String(q.number) : `${q.number}${sp.label}`;
        steps.push({ scenarioIdx: si, questionIdx: qi, subPartIdx: spi, question: q, subPart: sp, numberLabel });
      });
    });
  });
  return steps;
}

// --- Speech recognition (Web Speech API) ---

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>; resultIndex: number }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface SpeechRecognitionCtor { new (): SpeechRecognitionInstance }

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// --- Main Content Component ---

function RTRExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId');
  const part = (searchParams.get('part') as 'part1' | 'part2') || 'part1';
  const mode: ExamMode = (searchParams.get('mode') as ExamMode) === 'simulate' ? 'simulate' : 'practice';

  const [view, setView] = useState<'loading' | 'error' | 'exam' | 'results'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [testTitle, setTestTitle] = useState('');

  // Part 1 State
  const [p1Questions, setP1Questions] = useState<Part1Question[]>([]);
  const [p1Answers, setP1Answers] = useState<(number | null)[]>([]);
  const [p1Flags, setP1Flags] = useState<boolean[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Part 2 State
  const [p2Scenarios, setP2Scenarios] = useState<Part2Scenario[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  // Answers keyed by step index. For sub-parts with blanks, each blank is a string in the array.
  const [p2Answers, setP2Answers] = useState<Record<number, string | string[]>>({});
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Tracks user intent vs. recognizer state. Continuous recognizers auto-stop on long
  // silence in some browsers — we restart while this stays true.
  const wantsListeningRef = useRef(false);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(part === 'part1' ? RTR_CONFIG.part1.duration * 60 : RTR_CONFIG.part2.duration * 60);

  const steps = useMemo(() => buildSteps(p2Scenarios), [p2Scenarios]);
  const currentStep = steps[stepIdx];
  const currentScenario = currentStep ? p2Scenarios[currentStep.scenarioIdx] : undefined;

  // Load data
  useEffect(() => {
    if (!testId) { setErrorMsg('No test specified.'); setView('error'); return; }
    const endpoint = part === 'part1' ? `/api/rtr/${testId}/part1` : `/api/rtr/${testId}/part2`;
    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        if (data.error === 'Unauthorized') { router.push('/login'); return; }
        if (data.error === 'Not purchased') { setErrorMsg('You have not purchased this test. Please go back and purchase it.'); setView('error'); return; }
        if (data.error) { setErrorMsg(data.error); setView('error'); return; }
        if (part === 'part1') {
          const qs = data.questions ?? [];
          setP1Questions(qs);
          setP1Answers(new Array(qs.length).fill(null));
          setP1Flags(new Array(qs.length).fill(false));
        } else {
          setP2Scenarios(data.scenarios ?? []);
        }
        setView('exam');
      })
      .catch(() => { setErrorMsg('Failed to load exam. Please try again.'); setView('error'); });

    fetch('/api/rtr/tests').then(r => r.json()).then(d => {
      const t = (d.tests ?? []).find((t: RTRTestSummary) => t.id === testId);
      if (t) setTestTitle(t.title);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, part]);

  // Countdown timer
  useEffect(() => {
    if (view !== 'exam') return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) { clearInterval(interval); finishExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const stopSpeaking = () => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const rtText = convertToRTPhraseology(text);
    const utterance = new SpeechSynthesisUtterance(rtText);
    utterance.lang = 'en-IN';
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeak = (text: string) => {
    if (speaking) stopSpeaking();
    else speak(text);
  };

  // Auto-play prompt when active sub-question changes (Part 2 only).
  useEffect(() => {
    if (view !== 'exam' || part !== 'part2' || !currentStep) return;
    speak(currentStep.subPart.prompt);
    return () => stopSpeaking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, view, part]);

  const startListening = (onChunk: (txt: string) => void) => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) { alert('Speech recognition is not supported in this browser. Please type your answer.'); return; }
    const rec = new Ctor();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const t = r[0].transcript.trim();
        if (r.isFinal && t) onChunk(t);
      }
    };
    rec.onend = () => {
      // Browsers (especially Chrome) will auto-end continuous sessions after a long
      // silence window. Restart while the user still wants to dictate.
      if (wantsListeningRef.current) {
        try { rec.start(); } catch { /* already started or unavailable — fall through */ }
      } else {
        setListening(false);
      }
    };
    rec.onerror = () => {
      wantsListeningRef.current = false;
      setListening(false);
    };
    recognitionRef.current = rec;
    wantsListeningRef.current = true;
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    wantsListeningRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  };

  // --- Step navigation ---

  const isStepAnswered = (idx: number): boolean => {
    const step = steps[idx];
    if (!step) return false;
    const ans = p2Answers[idx];
    if (step.subPart.blanks && step.subPart.blanks.length > 0) {
      const arr = Array.isArray(ans) ? ans : [];
      return step.subPart.blanks.every((_, bi) => (arr[bi] ?? '').trim().length > 0);
    }
    return typeof ans === 'string' && ans.trim().length > 0;
  };

  const goNext = () => {
    stopSpeaking();
    stopListening();
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
    else finishExam();
  };

  const goPrev = () => {
    if (mode === 'simulate') return;
    stopSpeaking();
    stopListening();
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const finishExam = async () => {
    try {
      if (part === 'part1') {
        const score = p1Questions.filter((q, i) => p1Answers[i] === q.correct).length;
        const answersMap: Record<string, number | null> = {};
        p1Questions.forEach((q, i) => { answersMap[q.id] = p1Answers[i]; });
        await fetch('/api/rtr/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: testId,
            part: 'part1',
            score,
            total: p1Questions.length,
            answers: answersMap,
          }),
        });
      } else {
        let totalObtained = 0;
        let totalPossible = 0;
        steps.forEach((step, i) => {
          const sp = step.subPart;
          totalPossible += sp.marks;
          const ans = p2Answers[i];
          if (sp.blanks && sp.blanks.length > 0) {
            const perBlank = sp.marks / sp.blanks.length;
            const arr = Array.isArray(ans) ? ans : [];
            sp.blanks.forEach((b, bi) => {
              const sim = calculateSimilarity(arr[bi] ?? '', b.expectedAnswer);
              totalObtained += (sim / 100) * perBlank;
            });
          } else {
            const sim = calculateSimilarity(typeof ans === 'string' ? ans : '', sp.expectedAnswer);
            totalObtained += (sim / 100) * sp.marks;
          }
        });
        await fetch('/api/rtr/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: testId,
            part: 'part2',
            score: Math.round(totalObtained),
            total: Math.round(totalPossible),
            answers: p2Answers,
          }),
        });
      }
    } catch {
      // Non-critical — don't block UX.
    }
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  if (view === 'loading') return (
    <><Header />
    <main className="grow pt-48 flex items-center justify-center bg-neutral-50">
      <div className="text-center"><div className="w-12 h-12 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-neutral-500 font-medium">Loading exam...</p></div>
    </main><Footer /></>
  );
  if (view === 'error') return (
    <><Header />
    <main className="grow pt-48 flex items-center justify-center bg-neutral-50">
      <div className="text-center max-w-md p-12 bg-white rounded-[2.5rem] border border-neutral-100 shadow-xl">
        <p className="text-4xl mb-6">⚠️</p>
        <h2 className="text-2xl font-black mb-4">Cannot Load Exam</h2>
        <p className="text-rose-500 mb-8">{errorMsg}</p>
        <Button onClick={() => router.push('/dgca-rtr')}>Back to RTR Tests</Button>
      </div>
    </main><Footer /></>
  );

  return (
    <>
      <Header />
      <main className="grow pt-24 bg-neutral-50 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-20 bg-white border-b border-neutral-100 z-40 px-6 py-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors" aria-label="Back">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div>
                <h1 className="text-lg font-black text-neutral-900">{testTitle}</h1>
                <span className="text-xs font-bold text-violet uppercase tracking-widest">
                  {part === 'part1'
                    ? 'Part 1 — Written MCQ'
                    : `Part 2 — RT Transmission · ${mode === 'simulate' ? 'Simulate Mode' : 'Practice Mode'}`}
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-2 font-mono text-xl ${timeRemaining < 300 ? 'text-rose-600 animate-pulse' : 'text-neutral-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" /></svg>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          {view === 'exam' && part === 'part1' && (
            <Part1View
              p1Questions={p1Questions}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              p1Answers={p1Answers}
              setP1Answers={setP1Answers}
              p1Flags={p1Flags}
              setP1Flags={setP1Flags}
              finishExam={finishExam}
            />
          )}

          {view === 'exam' && part === 'part2' && (
            <Part2View
              steps={steps}
              stepIdx={stepIdx}
              currentStep={currentStep}
              currentScenario={currentScenario}
              p2Answers={p2Answers}
              setP2Answers={setP2Answers}
              isStepAnswered={isStepAnswered}
              goNext={goNext}
              goPrev={goPrev}
              mode={mode}
              speaking={speaking}
              toggleSpeak={toggleSpeak}
              listening={listening}
              startListening={startListening}
              stopListening={stopListening}
              finishExam={finishExam}
            />
          )}

          {view === 'results' && (
            <ResultsView
              part={part}
              p1Questions={p1Questions}
              p1Answers={p1Answers}
              steps={steps}
              p2Answers={p2Answers}
              p2Scenarios={p2Scenarios}
              router={router}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

// --- Part 1 (MCQ) — extracted unchanged for readability ---

interface Part1ViewProps {
  p1Questions: Part1Question[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  p1Answers: (number | null)[];
  setP1Answers: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  p1Flags: boolean[];
  setP1Flags: React.Dispatch<React.SetStateAction<boolean[]>>;
  finishExam: () => void;
}

function Part1View({ p1Questions, currentIndex, setCurrentIndex, p1Answers, setP1Answers, p1Flags, setP1Flags, finishExam }: Part1ViewProps) {
  if (p1Questions.length === 0) {
    return <div className="text-center py-24 text-neutral-500">No questions configured for this test.</div>;
  }
  const q = p1Questions[currentIndex];
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="grow">
        <div className="bg-white rounded-3xl border-2 border-neutral-100 p-8 md:p-12 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <span className="text-sm font-bold text-neutral-400">Question {currentIndex + 1} of {p1Questions.length}</span>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-full">2 Marks</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-8 leading-tight">{q.question}</h2>
          <div className="grid gap-4 mb-12">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => { const next = [...p1Answers]; next[currentIndex] = i; setP1Answers(next); }}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${p1Answers[currentIndex] === i ? 'border-violet bg-violet/5' : 'border-neutral-50 bg-neutral-50 hover:bg-neutral-100'}`}
              >
                <span className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl font-bold ${p1Answers[currentIndex] === i ? 'bg-violet text-white' : 'bg-white text-neutral-400'}`}>{String.fromCharCode(65 + i)}</span>
                <span className={`font-semibold ${p1Answers[currentIndex] === i ? 'text-violet' : 'text-neutral-700'}`}>{opt}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>← Previous</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { const next = [...p1Flags]; next[currentIndex] = !next[currentIndex]; setP1Flags(next); }}>{p1Flags[currentIndex] ? '🚩 Flagged' : '🏳️ Flag'}</Button>
              <Button variant="secondary" onClick={() => { const next = [...p1Answers]; next[currentIndex] = null; setP1Answers(next); }}>Clear</Button>
            </div>
            <Button variant="primary" onClick={() => { if (currentIndex < p1Questions.length - 1) setCurrentIndex(prev => prev + 1); else finishExam(); }}>{currentIndex === p1Questions.length - 1 ? 'Review & Submit' : 'Next →'}</Button>
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-white rounded-3xl border-2 border-neutral-100 p-6 sticky top-44">
          <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-6">Question Palette</h3>
          <div className="grid grid-cols-5 gap-3 mb-8">
            {p1Questions.map((_, i) => {
              let bg = 'bg-neutral-50 text-neutral-400 border-neutral-50';
              if (i === currentIndex) bg = 'bg-white border-violet text-violet font-bold ring-2 ring-violet/20';
              else if (p1Flags[i]) bg = 'bg-rose-500 border-rose-500 text-white';
              else if (p1Answers[i] !== null) bg = 'bg-emerald-500 border-emerald-500 text-white';
              return (
                <button key={i} onClick={() => setCurrentIndex(i)} className={`w-10 h-10 rounded-xl border-2 text-xs flex items-center justify-center transition-all ${bg}`}>{i + 1}</button>
              );
            })}
          </div>
          <Button variant="violet" className="w-full mt-8" onClick={finishExam}>Submit Exam</Button>
        </div>
      </aside>
    </div>
  );
}

// --- Part 2 (Chart paper) ---

interface Part2ViewProps {
  steps: Step[];
  stepIdx: number;
  currentStep: Step | undefined;
  currentScenario: Part2Scenario | undefined;
  p2Answers: Record<number, string | string[]>;
  setP2Answers: React.Dispatch<React.SetStateAction<Record<number, string | string[]>>>;
  isStepAnswered: (idx: number) => boolean;
  goNext: () => void;
  goPrev: () => void;
  mode: ExamMode;
  speaking: boolean;
  toggleSpeak: (text: string) => void;
  listening: boolean;
  startListening: (onTranscript: (t: string) => void) => void;
  stopListening: () => void;
  finishExam: () => void;
}

function Part2View({ steps, stepIdx, currentStep, currentScenario, p2Answers, setP2Answers, isStepAnswered, goNext, goPrev, mode, speaking, toggleSpeak, listening, startListening, stopListening, finishExam }: Part2ViewProps) {
  if (steps.length === 0 || !currentStep || !currentScenario) {
    return (
      <div className="bg-white rounded-3xl border-2 border-neutral-100 p-12 text-center text-neutral-500 shadow-sm">
        <p className="text-lg font-bold mb-2">No chart questions configured</p>
        <p className="text-sm">An admin needs to add a chart with questions to this test before it can be attempted.</p>
      </div>
    );
  }

  const sp = currentStep.subPart;
  const ctx = currentScenario.chart_context;
  const answered = isStepAnswered(stepIdx);
  const isLast = stepIdx === steps.length - 1;

  const writeAnswer = (val: string | string[]) => {
    setP2Answers(prev => ({ ...prev, [stepIdx]: val }));
  };

  const writeBlank = (bi: number, val: string) => {
    setP2Answers(prev => {
      const existing = prev[stepIdx];
      const arr = Array.isArray(existing) ? [...existing] : new Array<string>(sp.blanks?.length ?? 0).fill('');
      arr[bi] = val;
      return { ...prev, [stepIdx]: arr };
    });
  };

  return (
    <div className="space-y-8">
      {/* Chart paper card */}
      <div className="bg-white rounded-3xl border-2 border-neutral-200 p-8 shadow-sm">
        <div className="flex items-baseline justify-between flex-wrap gap-y-2 mb-5 pb-3 border-b border-neutral-200">
          <h2 className="text-xl font-black text-neutral-900">{currentScenario.scenario}</h2>
          <div className="flex items-center gap-6 text-sm text-neutral-700">
            <span><span className="font-bold">Time allowed:</span> {ctx?.time_allowed || '25 minutes'}</span>
            <span><span className="font-bold">Total Marks:</span> {ctx?.total_marks ?? 100}</span>
          </div>
        </div>

        {ctx ? (
          <div className="space-y-2 text-sm text-neutral-800">
            {HEADER_ROWS.map((row, ri) => (
              <div key={ri} className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1">
                <HeaderCell label={row.left.label} value={ctx[row.left.key]} />
                {row.mid && <HeaderCell label={row.mid.label} value={ctx[row.mid.key]} />}
                {row.right && <HeaderCell label={row.right.label} value={ctx[row.right.key]} />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-amber-600 text-sm font-medium">Chart header not configured for this scenario.</p>
        )}

        {/* Note + 5 fixed instructions */}
        <div className="mt-6 pt-5 border-t border-dashed border-neutral-300">
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Note</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-neutral-600">
            {FIXED_NOTE_POINTS.map((pt, i) => <li key={i}>{pt}</li>)}
          </ol>
        </div>
      </div>

      {/* Active sub-question */}
      <div className="bg-white rounded-3xl border-2 border-neutral-100 p-8 md:p-10 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Question {currentStep.numberLabel}</span>
            <span className="text-xs text-neutral-400">({stepIdx + 1} of {steps.length})</span>
          </div>
          <span className="px-3 py-1 bg-violet/10 text-violet text-xs font-bold rounded-full">{sp.marks} Marks</span>
        </div>

        <div className="flex gap-3 items-start mb-6">
          <button
            onClick={() => toggleSpeak(sp.prompt)}
            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${speaking ? 'bg-violet text-white animate-pulse hover:bg-violet-700' : 'bg-violet/10 text-violet hover:bg-violet/20'}`}
            title={speaking ? 'Stop audio' : 'Play audio'}
            aria-label={speaking ? 'Stop audio' : 'Play audio'}
          >
            {speaking ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="4" height="12" rx="1" /><rect x="14" y="6" width="4" height="12" rx="1" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" /></svg>
            )}
          </button>
          <div className="grow p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
            <p className="text-base text-neutral-800 leading-relaxed">{sp.prompt}</p>
          </div>
        </div>

        {/* Answer area */}
        {sp.blanks && sp.blanks.length > 0 ? (
          <div className="space-y-3">
            {sp.blanks.map((b: RTRBlank, bi: number) => {
              const arr = Array.isArray(p2Answers[stepIdx]) ? (p2Answers[stepIdx] as string[]) : [];
              return (
                <div key={bi} className="flex flex-col md:flex-row md:items-center gap-2">
                  <label className="text-sm text-neutral-700 md:w-2/3">{bi + 1}. {b.label}</label>
                  <input
                    value={arr[bi] ?? ''}
                    onChange={e => writeBlank(bi, e.target.value)}
                    className="flex-1 bg-neutral-50 border-b-2 border-neutral-300 px-2 py-2 text-sm focus:border-violet focus:outline-none"
                    placeholder="Your answer"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Your transmission</label>
            <div className="relative">
              <textarea
                value={typeof p2Answers[stepIdx] === 'string' ? (p2Answers[stepIdx] as string) : ''}
                onChange={e => writeAnswer(e.target.value)}
                rows={5}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 pr-16 text-sm focus:ring-2 focus:ring-violet/20 focus:border-violet outline-none"
                placeholder="Type or use the mic to dictate your answer..."
              />
              <button
                onClick={() => {
                  if (listening) { stopListening(); return; }
                  // Use functional setState so each chunk appends to the latest text
                  // even when continuous recognition fires multiple onresult events.
                  startListening(chunk => {
                    setP2Answers(prev => {
                      const cur = typeof prev[stepIdx] === 'string' ? (prev[stepIdx] as string) : '';
                      return { ...prev, [stepIdx]: cur ? `${cur} ${chunk}` : chunk };
                    });
                  });
                }}
                className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${listening ? 'bg-rose-500 text-white animate-pulse' : 'bg-violet text-white hover:bg-violet-700'}`}
                title={listening ? 'Stop dictation' : 'Dictate'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 mt-8 border-t border-neutral-100">
          {mode === 'practice' ? (
            <Button variant="secondary" onClick={goPrev} disabled={stepIdx === 0}>← Previous</Button>
          ) : (
            <span className="text-xs text-neutral-400 italic">Simulate mode — no going back</span>
          )}
          <Button variant="primary" onClick={isLast ? finishExam : goNext} disabled={!answered}>
            {isLast ? 'Submit Exam' : `Next: Question ${steps[stepIdx + 1]?.numberLabel ?? ''} →`}
          </Button>
        </div>
        {!answered && (
          <p className="text-xs text-neutral-400 mt-3 text-right">Type or dictate your answer to continue.</p>
        )}
      </div>
    </div>
  );
}

function HeaderCell({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-neutral-500 shrink-0">{label}:</span>
      <span className="font-bold text-neutral-900 truncate">{value !== undefined && value !== '' ? value : <span className="text-neutral-300">—</span>}</span>
    </div>
  );
}

// --- Results ---

interface ResultsViewProps {
  part: 'part1' | 'part2';
  p1Questions: Part1Question[];
  p1Answers: (number | null)[];
  steps: Step[];
  p2Answers: Record<number, string | string[]>;
  p2Scenarios: Part2Scenario[];
  router: ReturnType<typeof useRouter>;
}

function ResultsView({ part, p1Questions, p1Answers, steps, p2Answers, p2Scenarios, router }: ResultsViewProps) {
  const part1Score = part === 'part1'
    ? p1Questions.filter((q, i) => p1Answers[i] === q.correct).length
    : 0;
  const part1Pct = part === 'part1' && p1Questions.length > 0 ? Math.round((part1Score / p1Questions.length) * 100) : 0;

  let part2Obtained = 0;
  let part2Possible = 0;
  if (part === 'part2') {
    steps.forEach((step, i) => {
      const sp = step.subPart;
      part2Possible += sp.marks;
      const ans = p2Answers[i];
      if (sp.blanks && sp.blanks.length > 0) {
        const perBlank = sp.marks / sp.blanks.length;
        const arr = Array.isArray(ans) ? ans : [];
        sp.blanks.forEach((b, bi) => {
          part2Obtained += (calculateSimilarity(arr[bi] ?? '', b.expectedAnswer) / 100) * perBlank;
        });
      } else {
        part2Obtained += (calculateSimilarity(typeof ans === 'string' ? ans : '', sp.expectedAnswer) / 100) * sp.marks;
      }
    });
  }
  const part2Pct = part === 'part2' && part2Possible > 0 ? Math.round((part2Obtained / part2Possible) * 100) : 0;
  const pct = part === 'part1' ? part1Pct : part2Pct;
  const passingMarks = part === 'part1' ? RTR_CONFIG.part1.passingMarks : RTR_CONFIG.part2.passingMarks;
  const passed = part === 'part1' ? part1Score >= passingMarks : Math.round(part2Obtained) >= passingMarks;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-[2.5rem] border-2 border-neutral-100 p-12 text-center shadow-sm">
        <h2 className="text-3xl font-black mb-8">Mock Exam Results</h2>
        <div className="flex justify-center gap-12 items-center mb-10">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-100" />
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 56} strokeDashoffset={(2 * Math.PI * 56) * (1 - pct / 100)} className="text-violet" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">{pct}%</div>
          </div>
          <div className="text-left">
            <div className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{passed ? 'PASSED' : 'NOT PASSED'}</div>
            <div className="text-neutral-500 font-bold">Passing: {passingMarks} Marks</div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="primary" onClick={() => window.location.reload()}>Retry Test</Button>
          <Button variant="secondary" onClick={() => router.push('/dgca-rtr')}>Back to Dashboard</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black px-4 uppercase tracking-wider">Detailed Review</h3>
        {part === 'part1' ? (
          p1Questions.map((q, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-neutral-400">QUESTION {i + 1}</span>
                <span className={`text-xs font-bold ${p1Answers[i] === q.correct ? 'text-emerald-600' : 'text-rose-600'}`}>{p1Answers[i] === q.correct ? '✓ CORRECT' : '✗ INCORRECT'}</span>
              </div>
              <h4 className="font-bold text-neutral-900 mb-4">{q.question}</h4>
              {q.explanation && (
                <div className="p-4 bg-neutral-50 rounded-xl text-sm">
                  <span className="font-bold text-neutral-400 block mb-1">EXPLANATION:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        ) : (
          steps.map((step, i) => {
            const sp = step.subPart;
            const ans = p2Answers[i];
            const sc = p2Scenarios[step.scenarioIdx];
            return (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-black text-neutral-400 uppercase">{sc.scenario} · Q{step.numberLabel}</span>
                  <span className="text-xs font-bold text-violet">{sp.marks} marks</span>
                </div>
                <p className="text-sm text-neutral-700 mb-4">{sp.prompt}</p>
                {sp.blanks && sp.blanks.length > 0 ? (
                  <div className="space-y-2">
                    {sp.blanks.map((b, bi) => {
                      const arr = Array.isArray(ans) ? ans : [];
                      const sim = calculateSimilarity(arr[bi] ?? '', b.expectedAnswer);
                      return (
                        <div key={bi} className="p-3 bg-neutral-50 rounded-xl text-sm border-l-4 border-emerald-500">
                          <p className="text-xs font-bold text-neutral-500 mb-1">{b.label}</p>
                          <p className="italic text-neutral-700">&ldquo;{arr[bi] || '—'}&rdquo;</p>
                          <p className="text-xs text-neutral-400 mt-1">Expected: <span className="text-emerald-700 font-medium">{b.expectedAnswer}</span> · <span className={sim > 70 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{Math.round(sim)}% match</span></p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-neutral-50 rounded-xl border-l-4 border-emerald-500">
                    <p className="text-neutral-700 italic mb-2">&ldquo;{typeof ans === 'string' && ans ? ans : 'No transmission recorded.'}&rdquo;</p>
                    <p className="text-xs text-neutral-400 font-bold uppercase">Expected:</p>
                    <p className="text-sm font-medium text-emerald-700">{sp.expectedAnswer}</p>
                    <p className="text-xs mt-2"><span className={calculateSimilarity(typeof ans === 'string' ? ans : '', sp.expectedAnswer) > 70 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{Math.round(calculateSimilarity(typeof ans === 'string' ? ans : '', sp.expectedAnswer))}% match</span></p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function RTRExamPage() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Loading exam...</div>}>
      <RTRExamContent />
    </Suspense>
  );
}
