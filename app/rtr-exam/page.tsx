'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RTR_CONFIG } from '@/app/constants/data';
import { Button } from '@/components/ui/Button';

interface Part1Question {
  id: string;
  test_id?: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string | null;
}

interface PilotExchange {
  role: 'pilot';
  prompt: string;
  expectedAnswer: string;
}
interface ATCExchange {
  role: 'atc';
  text: string;
}
type Exchange = PilotExchange | ATCExchange;

interface Part2Scenario {
  id: string;
  test_id?: string;
  marks: number;
  scenario: string;
  instruction?: string | null;
  exchanges: Exchange[];
}

interface RTRTestSummary { id: string; title: string }

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

// --- Main Content Component ---

function RTRExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId');
  const part = (searchParams.get('part') as 'part1' | 'part2') || 'part1';

  const [view, setView] = useState<'loading' | 'error' | 'exam' | 'results'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [testTitle, setTestTitle] = useState('');

  // Part 1 State
  const [p1Questions, setP1Questions] = useState<Part1Question[]>([]);
  const [p1Answers, setP1Answers] = useState<(number | null)[]>([]);
  const [p1Flags, setP1Flags] = useState<boolean[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Part 2 State
  const [p2Questions, setP2Questions] = useState<Part2Scenario[]>([]);
  const [p2Answers, setP2Answers] = useState<Record<string, Record<number, string>>>({});
  const [p2RevealedState, setP2RevealedState] = useState<Record<string, number>>({});

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(part === 'part1' ? RTR_CONFIG.part1.duration * 60 : RTR_CONFIG.part2.duration * 60);

  // Load data from API
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
          const scenarios = data.scenarios ?? [];
          setP2Questions(scenarios);
          const initialRevealed: Record<string, number> = {};
          scenarios.forEach((q: Part2Scenario) => { initialRevealed[q.id] = 1; });
          setP2RevealedState(initialRevealed);
        }
        setView('exam');
      })
      .catch(() => { setErrorMsg('Failed to load exam. Please try again.'); setView('error'); });

    // Also fetch test title
    fetch('/api/rtr/tests').then(r => r.json()).then(d => {
      const t = (d.tests ?? []).find((t: RTRTestSummary) => t.id === testId);
      if (t) setTestTitle(t.title);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, part]);

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

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const rtText = convertToRTPhraseology(text);
    const utterance = new SpeechSynthesisUtterance(rtText);
    utterance.lang = 'en-IN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const revealNextATC = (qId: string, nextIdx: number) => {
    const q = p2Questions.find(q => q.id === qId);
    if (!q) return;
    let revealTo = nextIdx + 1;
    if (revealTo < q.exchanges.length && q.exchanges[revealTo].role === 'pilot') revealTo++;
    setP2RevealedState(prev => ({ ...prev, [qId]: revealTo }));
    const atcEx = q.exchanges[nextIdx];
    if (atcEx && atcEx.role === 'atc') speak(atcEx.text);
  };

  const finishExam = async () => {
    // Save results to backend
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
        // Part 2: calculate similarity-based score
        let totalObtained = 0;
        let totalPossible = 0;
        p2Questions.forEach((q) => {
          totalPossible += q.marks;
          const pilotExchanges = q.exchanges.filter((e): e is PilotExchange => e.role === 'pilot');
          const qAnswers = p2Answers[q.id] || {};
          let qScore = 0;
          pilotExchanges.forEach((ex, ei) => {
            const sim = calculateSimilarity(qAnswers[ei] || '', ex.expectedAnswer);
            qScore += (sim / 100) * (q.marks / pilotExchanges.length);
          });
          totalObtained += qScore;
        });
        await fetch('/api/rtr/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: testId,
            part: 'part2',
            score: Math.round(totalObtained),
            total: totalPossible,
            answers: p2Answers,
          }),
        });
      }
    } catch {
      // Non-critical — don't block UX
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
    <main className="flex-grow pt-48 flex items-center justify-center bg-neutral-50">
      <div className="text-center"><div className="w-12 h-12 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-neutral-500 font-medium">Loading exam...</p></div>
    </main><Footer /></>
  );
  if (view === 'error') return (
    <><Header />
    <main className="flex-grow pt-48 flex items-center justify-center bg-neutral-50">
      <div className="text-center max-w-md p-12 bg-white rounded-[2.5rem] border border-neutral-100 shadow-xl">
        <p className="text-4xl mb-6">⚠️</p>
        <h2 className="text-2xl font-black mb-4">Cannot Load Exam</h2>
        <p className="text-rose-500 mb-8">{errorMsg}</p>
        <Button onClick={() => router.push('/dgca-rtr')}>Back to RTR Tests</Button>
      </div>
    </main><Footer /></>
  );
  const test = { title: testTitle };

  return (
    <>
      <Header />
      <main className="flex-grow pt-24 bg-neutral-50 min-h-screen">
        {/* Exam Top Bar */}
        <div className="sticky top-20 bg-white border-b border-neutral-100 z-40 px-6 py-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-black text-neutral-900">{test.title}</h1>
                <span className="text-xs font-bold text-violet uppercase tracking-widest">
                  {part === 'part1' ? 'Part 1 — Written MCQ' : 'Part 2 — RT Transmission'}
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-2 font-mono text-xl ${timeRemaining < 300 ? 'text-rose-600 animate-pulse' : 'text-neutral-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          {view === 'exam' && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Question Panel */}
              <div className="flex-grow">
                {part === 'part1' ? (
                  <div className="bg-white rounded-3xl border-2 border-neutral-100 p-8 md:p-12 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-sm font-bold text-neutral-400">Question {currentIndex + 1} of {p1Questions.length}</span>
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-full">2 Marks</span>
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-8 leading-tight">
                      {p1Questions[currentIndex]?.question}
                    </h2>
                    <div className="grid gap-4 mb-12">
                      {p1Questions[currentIndex]?.options.map((opt: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            const newAns = [...p1Answers];
                            newAns[currentIndex] = i;
                            setP1Answers(newAns);
                          }}
                          className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${p1Answers[currentIndex] === i ? 'border-violet bg-violet/5' : 'border-neutral-50 bg-neutral-50 hover:bg-neutral-100'}`}
                        >
                          <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-bold ${p1Answers[currentIndex] === i ? 'bg-violet text-white' : 'bg-white text-neutral-400'}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className={`font-semibold ${p1Answers[currentIndex] === i ? 'text-violet' : 'text-neutral-700'}`}>{opt}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-8 border-t border-neutral-100">
                      <Button variant="secondary" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>← Previous</Button>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                          const newFlags = [...p1Flags];
                          newFlags[currentIndex] = !newFlags[currentIndex];
                          setP1Flags(newFlags);
                        }}>{p1Flags[currentIndex] ? '🚩 Flagged' : '🏳️ Flag'}</Button>
                        <Button variant="secondary" onClick={() => {
                          const newAns = [...p1Answers];
                          newAns[currentIndex] = null;
                          setP1Answers(newAns);
                        }}>Clear</Button>
                      </div>
                      <Button variant="primary" onClick={() => {
                        if (currentIndex < p1Questions.length - 1) setCurrentIndex(prev => prev + 1);
                        else finishExam();
                      }}>{currentIndex === p1Questions.length - 1 ? 'Review & Submit' : 'Next →'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Part 2: RT Transmission */}
                    <div className="bg-white rounded-3xl border-2 border-neutral-100 p-8 md:p-12 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Question {currentIndex + 1} of {p2Questions.length}</span>
                        <span className="px-3 py-1 bg-violet-50 text-violet text-xs font-bold rounded-full">{p2Questions[currentIndex]?.marks} Marks</span>
                      </div>
                      <h2 className="text-2xl font-black text-neutral-900 mb-4">{p2Questions[currentIndex]?.scenario}</h2>
                      <p className="text-neutral-500 mb-10 italic">&ldquo;{p2Questions[currentIndex]?.instruction}&rdquo;</p>
                      
                      <div className="space-y-6">
                        {p2Questions[currentIndex]?.exchanges.map((ex, i) => {
                          const isVisible = i < (p2RevealedState[p2Questions[currentIndex].id] || 1);
                          if (!isVisible) return null;

                          if (ex.role === 'atc') {
                            return (
                              <div key={i} className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet flex items-center justify-center flex-shrink-0">📡</div>
                                <div className="flex-grow p-4 bg-violet/5 rounded-2xl rounded-tl-none border border-violet/10">
                                  <span className="block text-[10px] font-bold text-violet uppercase tracking-tighter mb-1">ATC</span>
                                  <p className="text-neutral-800 font-medium">{ex.text}</p>
                                </div>
                              </div>
                            );
                          } else {
                            const pilotExIdx = p2Questions[currentIndex].exchanges.slice(0, i).filter((e) => e.role === 'pilot').length;
                            const isLastVisible = i === (p2RevealedState[p2Questions[currentIndex].id] || 1) - 1;
                            const nextIsATC = i + 1 < p2Questions[currentIndex].exchanges.length && p2Questions[currentIndex].exchanges[i + 1].role === 'atc';

                            return (
                              <div key={i} className="flex gap-4 items-start flex-row-reverse">
                                <div className="w-10 h-10 rounded-xl bg-emerald/10 text-emerald-600 flex items-center justify-center flex-shrink-0">🎙️</div>
                                <div className="flex-grow p-4 bg-white border-2 border-neutral-100 rounded-2xl rounded-tr-none">
                                  <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mb-1">YOU (PILOT)</span>
                                  <p className="text-neutral-400 text-xs mb-3 font-bold">{ex.prompt}</p>
                                  <textarea 
                                    className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet/20 focus:border-violet outline-none min-h-[80px]"
                                    placeholder="Type your transmission..."
                                    value={p2Answers[p2Questions[currentIndex].id]?.[pilotExIdx] || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                      const val = e.target.value;
                                      setP2Answers(prev => ({
                                        ...prev,
                                        [p2Questions[currentIndex].id]: { ...prev[p2Questions[currentIndex].id], [pilotExIdx]: val }
                                      }));
                                    }}
                                  />
                                  {isLastVisible && nextIsATC && (
                                    <button 
                                      onClick={() => revealNextATC(p2Questions[currentIndex].id, i + 1)}
                                      className="mt-4 flex items-center gap-2 text-xs font-black text-violet hover:bg-violet/5 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      REVEAL ATC RESPONSE ⮕
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="secondary" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>← Previous Scenario</Button>
                      <Button variant="primary" onClick={() => {
                        if (currentIndex < p2Questions.length - 1) setCurrentIndex(prev => prev + 1);
                        else finishExam();
                      }}>{currentIndex === p2Questions.length - 1 ? 'Submit Mock Exam' : 'Next Scenario →'}</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Palette */}
              <aside className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-3xl border-2 border-neutral-100 p-6 sticky top-44">
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-6">Question Palette</h3>
                  <div className="grid grid-cols-5 gap-3 mb-8">
                    {(part === 'part1' ? p1Questions : p2Questions).map((_, i) => {
                      let bg = 'bg-neutral-50 text-neutral-400 border-neutral-50';
                      if (i === currentIndex) bg = 'bg-white border-violet text-violet font-bold ring-2 ring-violet/20';
                      else if (part === 'part1') {
                        if (p1Flags[i]) bg = 'bg-rose-500 border-rose-500 text-white';
                        else if (p1Answers[i] !== null) bg = 'bg-emerald-500 border-emerald-500 text-white';
                      } else {
                        const qId = p2Questions[i].id;
                        const ansCount = Object.keys(p2Answers[qId] || {}).length;
                        if (ansCount > 0) bg = 'bg-emerald-500 border-emerald-500 text-white';
                      }

                      return (
                        <button 
                          key={i} 
                          onClick={() => setCurrentIndex(i)}
                          className={`w-10 h-10 rounded-xl border-2 text-xs flex items-center justify-center transition-all ${bg}`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-3 pt-6 border-t border-neutral-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" /> Answered
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                      <span className="w-3 h-3 rounded-full bg-rose-500" /> Flagged
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                      <span className="w-3 h-3 rounded-full bg-neutral-100 border border-neutral-200" /> Pending
                    </div>
                  </div>
                  <Button variant="violet" className="w-full mt-8" onClick={finishExam}>Submit Exam</Button>
                </div>
              </aside>
            </div>
          )}

          {view === 'results' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Score Header */}
              <div className="bg-white rounded-[2.5rem] border-2 border-neutral-100 p-12 text-center shadow-sm">
                <h2 className="text-3xl font-black mb-8">Mock Exam Results</h2>
                <div className="flex justify-center gap-12 items-center mb-10">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-100" />
                      <circle 
                        cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 56} 
                        strokeDashoffset={(2 * Math.PI * 56) * (1 - (part === 'part1' ? p1Questions.filter((q,i)=>p1Answers[i]===q.correct).length/p1Questions.length : 0.8))} 
                        className="text-violet"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">
                      {part === 'part1' ? Math.round((p1Questions.filter((q,i)=>p1Answers[i]===q.correct).length/p1Questions.length)*100) : 80}%
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-3xl font-black text-emerald-600">PASSED</div>
                    <div className="text-neutral-500 font-bold">Passing: {part === 'part1' ? RTR_CONFIG.part1.passingMarks : RTR_CONFIG.part2.passingMarks} Marks</div>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <Button variant="primary" onClick={() => window.location.reload()}>Retry Test</Button>
                  <Button variant="secondary" onClick={() => router.push('/dgca-rtr')}>Back to Dashboard</Button>
                </div>
              </div>

              {/* Review Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-black px-4 uppercase tracking-wider">Detailed Review</h3>
                {part === 'part1' ? (
                  p1Questions.map((q, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-black text-neutral-400">QUESTION {i + 1}</span>
                        <span className={`text-xs font-bold ${p1Answers[i] === q.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {p1Answers[i] === q.correct ? '✓ CORRECT' : '✗ INCORRECT'}
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-900 mb-4">{q.question}</h4>
                      <div className="p-4 bg-neutral-50 rounded-xl text-sm">
                        <span className="font-bold text-neutral-400 block mb-1">EXPLANATION:</span>
                        {q.explanation}
                      </div>
                    </div>
                  ))
                ) : (
                  p2Questions.map((q, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-black text-neutral-400">QUESTION {i + 1}</span>
                        <span className="text-xs font-bold text-emerald-600 uppercase">Review Analysis →</span>
                      </div>
                      <h4 className="font-bold text-neutral-900 mb-4">{q.scenario}</h4>
                      <div className="space-y-3">
                        {q.exchanges.filter((e): e is PilotExchange => e.role === 'pilot').map((ex, ei) => {
                          const similarity = calculateSimilarity(p2Answers[q.id]?.[ei] || '', ex.expectedAnswer);
                          return (
                            <div key={ei} className="p-4 bg-neutral-50 rounded-xl border-l-4 border-emerald-500">
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-neutral-400 uppercase">{ex.prompt}</span>
                                <span className={similarity > 70 ? 'text-emerald-600' : 'text-rose-600'}>{Math.round(similarity)}% MATCH</span>
                              </div>
                              <p className="text-neutral-700 italic mb-2">&ldquo;{p2Answers[q.id]?.[ei] || 'No transmission recorded.'}&rdquo;</p>
                              <p className="text-xs text-neutral-400 font-bold uppercase mt-2">Expected Phraseology:</p>
                              <p className="text-sm font-medium text-emerald-700">{ex.expectedAnswer}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function RTRExamPage() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Loading exam...</div>}>
      <RTRExamContent />
    </Suspense>
  );
}
