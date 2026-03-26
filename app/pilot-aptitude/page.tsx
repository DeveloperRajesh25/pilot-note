"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { APTITUDE_QUESTIONS, APTITUDE_CATEGORIES } from '@/app/constants/data';
import { Button } from '@/components/ui/Button';

type Question = typeof APTITUDE_QUESTIONS[0];

export default function PilotAptitudePage() {
  const [view, setView] = useState<'selection' | 'test' | 'results'>('selection');
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullTest, setIsFullTest] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'test') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view]);

  const startTest = useCallback((category: string | null) => {
    const isFull = !category;
    const filtered = isFull 
      ? [...APTITUDE_QUESTIONS].sort(() => Math.random() - 0.5)
      : APTITUDE_QUESTIONS.filter(q => q.category === category).sort(() => Math.random() - 0.5);

    setQuestions(filtered);
    setAnswers(new Array(filtered.length).fill(null));
    setCurrentIndex(0);
    setElapsedSeconds(0);
    setIsFullTest(isFull);
    setCurrentCategory(category || 'Full COMPASS Test');
    setView('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAnswer = (optionIndex: number) => {
    if (answers[currentIndex] !== null) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const finishTest = () => {
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <Header />
      <main className="flex-grow pt-32 pb-24 bg-neutral-50 min-h-screen">
        <div className="container mx-auto px-6">
          {view === 'selection' && (
            <SelectionView onStart={startTest} />
          )}

          {view === 'test' && (
            <div className="max-w-3xl mx-auto bg-white rounded-[2rem] border-2 border-neutral-100 shadow-xl p-8 md:p-12">
              <div className="flex justify-between items-center mb-8">
                <span className="px-4 py-1.5 bg-violet-50 text-violet text-xs font-bold rounded-full uppercase tracking-wider">
                  {currentCategory}
                </span>
                <div className="flex items-center gap-2 text-gray-500 font-mono text-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path d="M12 6v6l4 2" strokeWidth="2" />
                  </svg>
                  {formatTime(elapsedSeconds)}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-10">
                <div className="flex justify-between text-sm font-bold text-gray-400 mb-3">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-neutral-900 mb-8 leading-tight">
                  {questions[currentIndex].question}
                </h3>
                <div className="grid gap-4">
                  {questions[currentIndex].options.map((opt, i) => {
                    const isSelected = answers[currentIndex] === i;
                    const isCorrect = questions[currentIndex].correct === i;
                    const hasAnswered = answers[currentIndex] !== null;
                    
                    let bgClass = "bg-neutral-50 border-neutral-100 hover:bg-neutral-100";
                    let textClass = "text-neutral-700";
                    let letterClass = "bg-white text-neutral-400";

                    if (hasAnswered) {
                      if (isCorrect) {
                        bgClass = "bg-emerald-50 border-emerald-200";
                        textClass = "text-emerald-700";
                        letterClass = "bg-emerald-500 text-white";
                      } else if (isSelected) {
                        bgClass = "bg-rose-50 border-rose-200";
                        textClass = "text-rose-700";
                        letterClass = "bg-rose-500 text-white";
                      }
                    } else if (isSelected) {
                      bgClass = "bg-violet-50 border-violet-200";
                      textClass = "text-violet-700";
                      letterClass = "bg-violet-500 text-white";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={hasAnswered}
                        className={`flex items-center gap-5 p-5 rounded-2xl border-2 transition-all text-left group ${bgClass}`}
                      >
                        <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors ${letterClass}`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className={`font-semibold ${textClass}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              {answers[currentIndex] !== null && (
                <div className="mb-10 p-6 bg-accent-glow rounded-2xl border-l-4 border-accent">
                  <h4 className="font-bold text-accent-dark mb-2">Explanation:</h4>
                  <p className="text-neutral-600 leading-relaxed">{questions[currentIndex].explanation}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-8 border-t border-neutral-100">
                <Button 
                  variant="secondary" 
                  onClick={prevQuestion} 
                  disabled={currentIndex === 0}
                >
                  ← Previous
                </Button>
                
                {currentIndex === questions.length - 1 ? (
                  <Button 
                    variant="violet" 
                    onClick={finishTest}
                    disabled={answers[currentIndex] === null}
                  >
                    Finish Test
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    onClick={nextQuestion}
                    disabled={answers[currentIndex] === null}
                  >
                    Next →
                  </Button>
                )}
              </div>
            </div>
          )}

          {view === 'results' && (
            <ResultsView 
              questions={questions} 
              answers={answers} 
              onRetry={() => startTest(isFullTest ? null : currentCategory)}
              onBack={() => setView('selection')}
              category={currentCategory || ''}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function SelectionView({ onStart }: { onStart: (cat: string | null) => void }) {
  const categoryMeta: Record<string, any> = {
    'Spatial Reasoning': {
      icon: '📐',
      color: 'bg-emerald-50 text-emerald-600',
      desc: 'Test your ability to mentally rotate objects, understand spatial relationships, and visualize 3D concepts.'
    },
    'Numerical Ability': {
      icon: '🔢',
      color: 'bg-violet-50 text-violet',
      desc: 'Assess your speed and accuracy with aviation-related calculations — fuel, time, distance, and more.'
    },
    'Verbal Reasoning': {
      icon: '💬',
      color: 'bg-blue-50 text-blue-600',
      desc: 'Evaluate your communication skills, vocabulary, analogies, and comprehension abilities.'
    },
    'Instrument Comprehension': {
      icon: '✈️',
      color: 'bg-orange-50 text-orange-600',
      desc: 'Test your ability to read and interpret cockpit instruments and flight displays accurately.'
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <span className="px-4 py-1.5 bg-accent-glow text-accent-dark text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block">
          COMPASS Test
        </span>
        <h2 className="text-4xl md:text-5xl font-black mb-6">Choose Your Test Category</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Assess your skills across all four COMPASS aptitude domains. Take individual tests or attempt the full assessment.
        </p>
      </div>

      <div className="flex justify-center mb-16">
        <Button variant="violet" size="lg" onClick={() => onStart(null)}>
          Take Full COMPASS Test (All Categories) →
        </Button>
      </div>

      <div className="grid md:grid-template-columns-2 lg:grid-cols-2 gap-8">
        {APTITUDE_CATEGORIES.map(cat => {
          const meta = categoryMeta[cat];
          return (
            <div 
              key={cat}
              onClick={() => onStart(cat)}
              className="bg-white p-8 rounded-[2rem] border-2 border-neutral-100 hover:border-violet/20 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-transform group-hover:scale-110 ${meta.color}`}>
                {meta.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{cat}</h3>
              <p className="text-gray-500 leading-relaxed mb-6">{meta.desc}</p>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-neutral-400">Questions: {APTITUDE_QUESTIONS.filter(q => q.category === cat).length}</span>
                <span className="text-violet group-hover:translate-x-1 transition-transform">Start Test →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsView({ questions, answers, onRetry, onBack, category }: { 
  questions: Question[], 
  answers: (number | null)[], 
  onRetry: () => void, 
  onBack: () => void,
  category: string
}) {
  const correctCount = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
  const percentage = Math.round((correctCount / questions.length) * 100);

  const categoryScores: Record<string, { correct: number, total: number }> = {};
  questions.forEach((q, i) => {
    if (!categoryScores[q.category]) categoryScores[q.category] = { correct: 0, total: 0 };
    categoryScores[q.category].total++;
    if (answers[i] === q.correct) categoryScores[q.category].correct++;
  });

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] border-2 border-neutral-100 shadow-2xl p-10 md:p-16 text-center">
      <span className="px-4 py-1.5 bg-accent-glow text-accent-dark text-xs font-bold rounded-full uppercase tracking-wider mb-6 inline-block">
        Test Result
      </span>
      <h2 className="text-3xl md:text-4xl font-black mb-10">{category} Analysis</h2>

      {/* Score Circle */}
      <div className="relative w-48 h-48 mx-auto mb-12">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="96" cy="96" r="80" 
            stroke="currentColor" strokeWidth="12" fill="transparent" 
            className="text-neutral-100" 
          />
          <circle 
            cx="96" cy="96" r="80" 
            stroke="currentColor" strokeWidth="12" fill="transparent" 
            strokeDasharray={2 * Math.PI * 80}
            strokeDashoffset={(2 * Math.PI * 80) * (1 - percentage / 100)}
            strokeLinecap="round"
            className="text-violet transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-neutral-900">{percentage}%</span>
          <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{correctCount}/{questions.length} Correct</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="text-left mb-12 space-y-4">
        <h3 className="text-lg font-black text-neutral-900 mb-6 uppercase tracking-wider">Performance Breakdown</h3>
        {Object.entries(categoryScores).map(([cat, score]) => {
          const catPct = Math.round((score.correct / score.total) * 100);
          return (
            <div key={cat} className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-neutral-800">{cat}</span>
                <span className="text-sm font-black text-violet">{catPct}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet"
                  style={{ width: `${catPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <Button variant="primary" size="lg" onClick={onRetry}>Retry Test</Button>
        <Button variant="secondary" size="lg" onClick={onBack}>Back to Categories</Button>
      </div>
    </div>
  );
}
