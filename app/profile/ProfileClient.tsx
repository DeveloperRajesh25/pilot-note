'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  LogOut,
  BookOpen,
  Target,
  Trophy,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  GraduationCap,
  Pencil,
  KeyRound,
  Loader2,
  PlayCircle,
  Receipt,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signOut } from '@/app/actions/auth';
import { updateProfile } from '@/app/actions/profile';
import { updatePassword } from '@/app/actions/auth';

type Tab = 'overview' | 'tests' | 'results' | 'settings';

interface UserSummary { id: string; email: string; created_at: string }
interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
interface AptitudeResult {
  id: string;
  category: string;
  score: number;
  total: number;
  time_taken: number;
  created_at: string;
}
interface DgcaPurchase {
  id: string;
  chapter_id: string;
  amount: number;
  purchased_at: string;
  dgca_chapters?: { title: string; dgca_subjects?: { name: string } | null } | null;
}
interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number | null;
  total: number | null;
  started_at: string;
  submitted_at: string | null;
  exams?: { title: string; subject: string } | null;
}
interface ExamRegistration {
  id: string;
  exam_id: string;
  registered_at: string;
  exams?: { title: string; subject: string; exam_date: string | null; exam_time: string | null; fee: number; status: string } | null;
}

interface Props {
  user: UserSummary;
  profile: Profile | null;
  dgcaPurchases: DgcaPurchase[];
  aptitudeResults: AptitudeResult[];
  examAttempts: ExamAttempt[];
  examRegistrations: ExamRegistration[];
}

const formatDate = (iso: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('en-IN', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });

const pctColor = (pct: number) =>
  pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';

const initialsFrom = (name: string, email: string) => {
  const source = name.trim() || email;
  const parts = source.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function ProfileClient({
  user,
  profile,
  dgcaPurchases,
  aptitudeResults,
  examAttempts,
  examRegistrations,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const router = useRouter();

  const displayName = profile?.full_name?.trim() || user.email.split('@')[0] || 'Pilot';
  const joinDate = formatDate(user.created_at, { month: 'long', year: 'numeric' });
  const initials = initialsFrom(profile?.full_name ?? '', user.email);

  const stats = useMemo(() => {
    const totalAptitude = aptitudeResults.length;
    const totalExams = examAttempts.filter((a) => a.submitted_at).length;
    const totalTestsTaken = totalAptitude + totalExams;

    const avgPct = (rows: { score: number; total: number }[]) => {
      if (rows.length === 0) return null;
      const sum = rows.reduce((acc, r) => acc + (r.total > 0 ? r.score / r.total : 0), 0);
      return Math.round((sum / rows.length) * 100);
    };

    const avgAptitude = avgPct(aptitudeResults);
    const avgExam = avgPct(
      examAttempts
        .filter((a) => a.submitted_at && a.total && a.score !== null)
        .map((a) => ({ score: a.score ?? 0, total: a.total ?? 1 }))
    );

    const totalSeconds = aptitudeResults.reduce((acc, r) => acc + (r.time_taken || 0), 0);

    return {
      totalAptitude,
      totalExams,
      totalTestsTaken,
      totalChapters: dgcaPurchases.length,
      avgAptitude,
      avgExam,
      totalMinutes: Math.round(totalSeconds / 60),
    };
  }, [aptitudeResults, examAttempts, dgcaPurchases.length]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'tests', label: 'Tests', icon: <BookOpen className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'results', label: 'Results', icon: <Award className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'settings', label: 'Settings', icon: <ShieldCheck className="w-4 h-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="group inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-6 sm:mb-10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back
      </button>

      {/* ───── Hero ───── */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 mb-10 sm:mb-14 items-start lg:items-end">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-4 sm:gap-6 mb-5 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 text-white font-display text-2xl sm:text-3xl flex items-center justify-center tracking-tight shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl leading-[1] sm:leading-[0.95] tracking-[-0.03em] text-neutral-900 break-words">
                {displayName.split(' ')[0]}
                {displayName.split(' ').length > 1 && (
                  <span className="italic-serif text-neutral-400"> {displayName.split(' ').slice(1).join(' ')}</span>
                )}
              </h1>
              <p className="text-neutral-500 text-xs sm:text-sm mt-2 flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
              CPL Aspirant
            </span>
            {stats.totalTestsTaken > 0 && (
              <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium">
                {stats.totalTestsTaken} tests taken
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] bg-neutral-900 text-white font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-start lg:justify-end">
          <form action={signOut} className="w-full sm:w-auto">
            <button
              type="submit"
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </form>
        </div>
      </div>

      {/* ───── Stats row ───── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl sm:rounded-3xl overflow-hidden mb-10 sm:mb-12">
        <StatCard label="DGCA Chapters" value={String(stats.totalChapters)} icon={<BookOpen className="w-4 h-4" strokeWidth={1.5} />} />
        <StatCard label="Avg. Pariksha" value={stats.avgExam === null ? '—' : `${stats.avgExam}%`} icon={<Target className="w-4 h-4" strokeWidth={1.5} />} />
        <StatCard label="Avg. Aptitude" value={stats.avgAptitude === null ? '—' : `${stats.avgAptitude}%`} icon={<Trophy className="w-4 h-4" strokeWidth={1.5} />} />
        <StatCard label="Practice Time" value={stats.totalMinutes > 0 ? `${stats.totalMinutes}m` : '—'} icon={<Clock className="w-4 h-4" strokeWidth={1.5} />} />
      </div>

      {/* ───── Tabs ───── */}
      <div className="border-b border-neutral-200 mb-8 sm:mb-10 sticky top-20 sm:top-24 bg-white/85 backdrop-blur-xl z-30 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 text-sm font-medium whitespace-nowrap border-b transition-colors ${
                tab === t.id
                  ? 'text-neutral-900 border-neutral-900'
                  : 'text-neutral-500 border-transparent hover:text-neutral-900'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ───── Tab content ───── */}
      <div className="animate-fade-in pb-16">
        {tab === 'overview' && (
          <OverviewTab
            displayName={displayName}
            aptitudeResults={aptitudeResults}
            examAttempts={examAttempts}
            dgcaPurchases={dgcaPurchases}
            examRegistrations={examRegistrations}
            avgExam={stats.avgExam}
            onJump={(t) => setTab(t)}
          />
        )}
        {tab === 'tests' && (
          <TestsTab dgcaPurchases={dgcaPurchases} examRegistrations={examRegistrations} />
        )}
        {tab === 'results' && (
          <ResultsTab
            aptitudeResults={aptitudeResults}
            examAttempts={examAttempts}
          />
        )}
        {tab === 'settings' && <SettingsTab user={user} profile={profile} />}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white p-4 sm:p-6 flex flex-col gap-2 sm:gap-3 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center justify-between">
        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center">
          {icon}
        </span>
      </div>
      <p className="font-display text-2xl sm:text-3xl md:text-4xl text-neutral-900 leading-none tracking-tight">
        {value}
      </p>
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-medium">{label}</p>
    </div>
  );
}

/* ────────── Overview ────────── */

function OverviewTab({
  displayName,
  aptitudeResults,
  examAttempts,
  dgcaPurchases,
  examRegistrations,
  avgExam,
  onJump,
}: {
  displayName: string;
  aptitudeResults: AptitudeResult[];
  examAttempts: ExamAttempt[];
  dgcaPurchases: DgcaPurchase[];
  examRegistrations: ExamRegistration[];
  avgExam: number | null;
  onJump: (t: Tab) => void;
}) {
  type ActivityItem = {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    iso: string;
    pct?: number;
    score?: string;
  };

  const activity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    aptitudeResults.forEach((r) => {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      items.push({
        id: `apt-${r.id}`,
        title: r.category,
        subtitle: 'Pilot Aptitude',
        date: formatDate(r.created_at),
        iso: r.created_at,
        pct,
        score: `${r.score}/${r.total}`,
      });
    });
    examAttempts
      .filter((a) => a.submitted_at && a.total && a.score !== null)
      .forEach((a) => {
        const total = a.total ?? 1;
        const score = a.score ?? 0;
        const pct = Math.round((score / total) * 100);
        items.push({
          id: `exam-${a.id}`,
          title: a.exams?.title ?? 'Pariksha Exam',
          subtitle: a.exams?.subject ? `Pariksha · ${a.exams.subject}` : 'Pariksha',
          date: formatDate(a.submitted_at!),
          iso: a.submitted_at!,
          pct,
          score: `${score}/${total}`,
        });
      });
    items.sort((a, b) => +new Date(b.iso) - +new Date(a.iso));
    return items.slice(0, 8);
  }, [aptitudeResults, examAttempts]);

  const upcoming = examRegistrations.filter((r) => {
    if (!r.exams?.exam_date) return false;
    const examDate = new Date(r.exams.exam_date);
    return examDate >= new Date(new Date().toDateString());
  });

  const isEmpty =
    aptitudeResults.length === 0 &&
    examAttempts.length === 0 &&
    dgcaPurchases.length === 0 &&
    examRegistrations.length === 0;

  if (isEmpty) {
    return (
      <div className="border border-neutral-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center">
        <h3 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-3">
          Welcome aboard, <span className="italic-serif">{displayName}.</span>
        </h3>
        <p className="text-neutral-500 mb-8 sm:mb-10 max-w-md mx-auto text-sm sm:text-base">
          Your training journey starts here. Practice DGCA chapter MCQs, sit an all-India Pariksha mock, or take a free aptitude test.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          <Button href="/dgca" className="justify-center">Practice DGCA</Button>
          <Button variant="secondary" href="/pariksha" className="justify-center">View Pariksha</Button>
          <Button variant="secondary" href="/pilot-aptitude" className="justify-center">Take aptitude test</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Recent Activity */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2">
            <span className="w-6 h-px bg-neutral-900" />
            Recent activity
          </h2>
          {activity.length > 0 && (
            <button
              onClick={() => onJump('results')}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {activity.length === 0 ? (
          <div className="border border-neutral-200 rounded-2xl py-12 text-center">
            <p className="text-neutral-400 text-sm mb-4">No test activity yet.</p>
            <Button size="sm" href="/pilot-aptitude">Start practicing</Button>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 sm:gap-5 p-4 sm:p-5 hover:bg-neutral-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate text-sm sm:text-base">{a.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{a.subtitle} · {a.date}</p>
                </div>
                {a.pct !== undefined && (
                  <div className="text-right shrink-0">
                    <p className={`font-display text-xl sm:text-2xl leading-none ${pctColor(a.pct)}`}>{a.pct}%</p>
                    <p className="text-[10px] text-neutral-400 mt-1 font-mono">{a.score}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side */}
      <div className="space-y-5 sm:space-y-6">
        {/* Upcoming */}
        <div className="border border-neutral-200 rounded-2xl p-5 sm:p-6">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
            <Calendar className="w-3.5 h-3.5" /> Upcoming
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-neutral-400 text-sm">No upcoming exam registrations.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((reg) => (
                <div key={reg.id} className="border-l-2 border-emerald-500 pl-3">
                  <p className="font-medium text-sm text-neutral-900 truncate">{reg.exams?.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {reg.exams?.exam_date ? formatDate(reg.exams.exam_date) : 'TBA'}
                    {reg.exams?.exam_time ? ` · ${reg.exams.exam_time}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="border border-neutral-200 rounded-2xl p-5 sm:p-6">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-5">
            Quick actions
          </h3>
          <div className="space-y-1">
            {[
              ['/dgca', 'Practice DGCA chapters'],
              ['/pariksha', 'View Pariksha exams'],
              ['/pilot-aptitude', 'Take aptitude test'],
              ['/guides', 'Read study guides'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between py-2.5 group"
              >
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900 link-underline">
                  {label}
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Pariksha avg */}
        {avgExam !== null && (
          <div className="bg-neutral-950 text-white rounded-2xl p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_60%)]" />
            <p className="relative text-[10px] uppercase tracking-[0.22em] text-emerald-400 font-medium mb-3">
              Pariksha avg.
            </p>
            <p className="relative font-display text-4xl sm:text-5xl text-white leading-none mb-2">{avgExam}%</p>
            <p className="relative text-xs text-white/60">Across all submitted exams</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────── My Tests ────────── */

function TestsTab({ dgcaPurchases, examRegistrations }: { dgcaPurchases: DgcaPurchase[]; examRegistrations: ExamRegistration[] }) {
  return (
    <div className="space-y-12">
      {/* DGCA chapters */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2">
            <span className="w-6 h-px bg-neutral-900" /> Unlocked DGCA chapters
          </h2>
          <span className="text-xs text-neutral-400 font-mono">{dgcaPurchases.length}</span>
        </div>

        {dgcaPurchases.length === 0 ? (
          <div className="border border-dashed border-neutral-200 rounded-2xl py-12 text-center">
            <Receipt className="w-8 h-8 text-neutral-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-neutral-500 mb-5 text-sm">You haven&apos;t unlocked any paid DGCA chapters yet.</p>
            <Button size="sm" href="/dgca">Practice DGCA</Button>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
            {dgcaPurchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-5 sm:p-6 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-neutral-900">{p.dgca_chapters?.title ?? p.chapter_id}</p>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-medium uppercase tracking-[0.14em] rounded-full border border-emerald-200/60">
                      Unlocked
                    </span>
                  </div>
                  {p.dgca_chapters?.dgca_subjects?.name && (
                    <p className="text-xs text-neutral-500 mt-1">{p.dgca_chapters.dgca_subjects.name}</p>
                  )}
                  <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 mt-2 font-mono">
                    Unlocked {formatDate(p.purchased_at)} · ₹{p.amount}
                  </p>
                </div>
                <Button size="sm" variant="violet" href="/dgca">
                  <PlayCircle className="w-3.5 h-3.5" /> Practice
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pariksha */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2">
            <span className="w-6 h-px bg-neutral-900" /> Pariksha registrations
          </h2>
          <span className="text-xs text-neutral-400 font-mono">{examRegistrations.length}</span>
        </div>

        {examRegistrations.length === 0 ? (
          <div className="border border-dashed border-neutral-200 rounded-2xl py-12 text-center">
            <GraduationCap className="w-8 h-8 text-neutral-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-neutral-500 mb-5 text-sm">No Pariksha exam registrations yet.</p>
            <Button size="sm" variant="violet" href="/pariksha">View Pariksha</Button>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
            {examRegistrations.map((reg) => {
              const examDate = reg.exams?.exam_date ? new Date(reg.exams.exam_date) : null;
              const isPast = examDate ? examDate < new Date(new Date().toDateString()) : false;
              return (
                <div key={reg.id} className="flex items-center justify-between gap-4 p-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-neutral-900">{reg.exams?.title ?? reg.exam_id}</p>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] rounded-full border ${
                          isPast
                            ? 'bg-neutral-100 text-neutral-500 border-neutral-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        }`}
                      >
                        {isPast ? 'Past' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {reg.exams?.subject}
                      {examDate ? ` · ${formatDate(examDate.toISOString())}` : ''}
                      {reg.exams?.exam_time ? ` · ${reg.exams.exam_time}` : ''}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 mt-1 font-mono">
                      Registered {formatDate(reg.registered_at)}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" href={`/pariksha/${reg.exam_id}`}>
                    Open <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────── Results ────────── */

function ResultsTab({
  aptitudeResults,
  examAttempts,
}: {
  aptitudeResults: AptitudeResult[];
  examAttempts: ExamAttempt[];
}) {
  const [filter, setFilter] = useState<'all' | 'pariksha' | 'aptitude'>('all');
  const submittedExams = examAttempts.filter((a) => a.submitted_at && a.total && a.score !== null);

  const filters = [
    { id: 'all' as const, label: 'All', count: submittedExams.length + aptitudeResults.length },
    { id: 'pariksha' as const, label: 'Pariksha', count: submittedExams.length },
    { id: 'aptitude' as const, label: 'Aptitude', count: aptitudeResults.length },
  ];

  return (
    <div className="space-y-10">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all ${
              filter === f.id
                ? 'bg-neutral-900 text-white border border-neutral-900'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'
            }`}
          >
            {f.label}
            <span
              className={`text-[10px] font-mono ${
                filter === f.id ? 'text-white/70' : 'text-neutral-400'
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {(filter === 'all' || filter === 'pariksha') && submittedExams.length > 0 && (
        <ResultGroup title="Pariksha" count={submittedExams.length}>
          {submittedExams.map((a) => {
            const total = a.total ?? 1;
            const score = a.score ?? 0;
            const pct = Math.round((score / total) * 100);
            return (
              <ResultRow
                key={a.id}
                title={a.exams?.title ?? a.exam_id}
                subtitle={`${a.exams?.subject ?? 'Pariksha'} · ${formatDate(a.submitted_at!)}`}
                pct={pct}
                score={`${score}/${total}`}
                href={`/pariksha/${a.exam_id}/results`}
              />
            );
          })}
        </ResultGroup>
      )}

      {(filter === 'all' || filter === 'aptitude') && aptitudeResults.length > 0 && (
        <ResultGroup title="Aptitude" count={aptitudeResults.length}>
          {aptitudeResults.map((r) => {
            const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
            const m = Math.floor(r.time_taken / 60);
            const s = r.time_taken % 60;
            return (
              <ResultRow
                key={r.id}
                title={r.category}
                subtitle={`${formatDate(r.created_at)} · ${m}m ${s}s`}
                pct={pct}
                score={`${r.score}/${r.total}`}
              />
            );
          })}
        </ResultGroup>
      )}

      {((filter === 'aptitude' && aptitudeResults.length === 0) ||
        (filter === 'pariksha' && submittedExams.length === 0) ||
        (filter === 'all' &&
          aptitudeResults.length === 0 &&
          submittedExams.length === 0)) && (
        <div className="border border-neutral-200 rounded-2xl py-16 text-center">
          <Award className="w-10 h-10 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-neutral-500 mb-6 text-sm">No results to show for this category yet.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="sm" href="/pariksha">Take a Pariksha mock</Button>
            <Button size="sm" variant="secondary" href="/pilot-aptitude">Aptitude test</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2">
          <span className="w-6 h-px bg-neutral-900" /> {title}
        </h3>
        <span className="text-xs text-neutral-400 font-mono">{count}</span>
      </div>
      <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ResultRow({ title, subtitle, pct, score, href }: { title: string; subtitle: string; pct: number; score: string; href?: string }) {
  const inner = (
    <>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 truncate">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:block w-24 h-px bg-neutral-200 relative">
          <div
            className={`absolute inset-y-0 left-0 ${
              pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${pct}%`, top: '-0.5px', bottom: '-0.5px' }}
          />
        </div>
        <p className={`font-display text-2xl leading-none ${pctColor(pct)}`}>{pct}%</p>
        <span className="hidden md:inline text-[10px] text-neutral-400 font-mono tabular-nums w-12 text-right">
          {score}
        </span>
        {href && <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group flex items-center justify-between gap-4 p-5 hover:bg-neutral-50 transition-colors">
        {inner}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 p-5 hover:bg-neutral-50 transition-colors">
      {inner}
    </div>
  );
}

/* ────────── Settings ────────── */

function SettingsTab({ user, profile }: { user: UserSummary; profile: Profile | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      <EditProfileForm user={user} profile={profile} />
      <ChangePasswordForm />

      <div className="lg:col-span-2">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
          <span className="w-6 h-px bg-neutral-900" /> Account information
        </h3>
        <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
          <InfoRow icon={<Mail className="w-4 h-4" strokeWidth={1.5} />} label="Email Address" value={user.email} />
          <InfoRow icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />} label="Member Since" value={formatDate(user.created_at, { day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow icon={<UserIcon className="w-4 h-4" strokeWidth={1.5} />} label="User ID" value={user.id} mono />
          <InfoRow icon={<CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />} label="Account Status" value="Verified · Active" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-4 sm:gap-5 p-4 sm:p-5">
      <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium mb-0.5">{label}</p>
        <p className={`text-neutral-900 truncate ${mono ? 'font-mono text-xs' : 'text-sm font-medium'}`}>{value}</p>
      </div>
    </div>
  );
}

function EditProfileForm({ user, profile }: { user: UserSummary; profile: Profile | null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile?.full_name ?? '');

  async function action(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await updateProfile(formData);
    if (result?.error) setError(result.error);
    else if (result?.message) setMessage(result.message);
    setLoading(false);
  }

  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
        <Pencil className="w-3.5 h-3.5" /> Profile details
      </h3>
      <p className="text-sm text-neutral-500 mb-6">Update how your name appears on the platform.</p>

      <form action={action} className="space-y-5">
        <Input
          label="Full name"
          name="full_name"
          type="text"
          placeholder="Capt. R. Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.14em]">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400 text-sm cursor-not-allowed"
          />
          <p className="text-[11px] text-neutral-400">Contact support to change your email.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200/60">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {message && (
          <div className="flex items-start gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200/60">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {message}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}

function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updatePassword(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
        <KeyRound className="w-3.5 h-3.5" /> Change password
      </h3>
      <p className="text-sm text-neutral-500 mb-6">You&apos;ll be signed out and asked to log in again.</p>

      <form action={action} className="space-y-5">
        <Input
          label="New password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          required
          minLength={6}
          autoComplete="new-password"
        />

        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200/60">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <Button type="submit" variant="violet" disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
