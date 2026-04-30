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
  TrendingUp,
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signOut } from '@/app/actions/auth';
import { updateProfile } from '@/app/actions/profile';
import { updatePassword } from '@/app/actions/auth';

type Tab = 'overview' | 'tests' | 'results' | 'settings';

interface UserSummary {
  id: string;
  email: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface RTRResult {
  id: string;
  test_id: string;
  part: 'part1' | 'part2' | string;
  score: number;
  total: number;
  created_at: string;
  rtr_tests?: { title: string } | null;
}

interface AptitudeResult {
  id: string;
  category: string;
  score: number;
  total: number;
  time_taken: number;
  created_at: string;
}

interface Purchase {
  id: string;
  test_id: string;
  amount: number;
  purchased_at: string;
  rtr_tests?: { title: string; description: string; price: number; status: string } | null;
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
  purchases: Purchase[];
  rtrResults: RTRResult[];
  aptitudeResults: AptitudeResult[];
  examAttempts: ExamAttempt[];
  examRegistrations: ExamRegistration[];
}

const formatDate = (iso: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('en-IN', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });

const pctColor = (pct: number) =>
  pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';

const pctBadge = (pct: number) =>
  pct >= 70
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : pct >= 50
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

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
  purchases,
  rtrResults,
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
    const totalRtr = rtrResults.length;
    const totalAptitude = aptitudeResults.length;
    const totalExams = examAttempts.filter((a) => a.submitted_at).length;
    const totalTestsTaken = totalRtr + totalAptitude + totalExams;

    const avgPct = (rows: { score: number; total: number }[]) => {
      if (rows.length === 0) return null;
      const sum = rows.reduce((acc, r) => acc + (r.total > 0 ? r.score / r.total : 0), 0);
      return Math.round((sum / rows.length) * 100);
    };

    const avgRtr = avgPct(rtrResults);
    const avgAptitude = avgPct(aptitudeResults);
    const avgExam = avgPct(
      examAttempts
        .filter((a) => a.submitted_at && a.total && a.score !== null)
        .map((a) => ({ score: a.score ?? 0, total: a.total ?? 1 }))
    );

    const totalSeconds = aptitudeResults.reduce((acc, r) => acc + (r.time_taken || 0), 0);

    return {
      totalRtr,
      totalAptitude,
      totalExams,
      totalTestsTaken,
      totalPurchases: purchases.length,
      avgRtr,
      avgAptitude,
      avgExam,
      totalMinutes: Math.round(totalSeconds / 60),
    };
  }, [rtrResults, aptitudeResults, examAttempts, purchases.length]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'tests', label: 'My Tests', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'results', label: 'Results', icon: <Award className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-6">
      <div className="space-y-8">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all text-sm font-semibold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent to-emerald-300 flex items-center justify-center text-neutral-900 font-black text-4xl shadow-lg shadow-accent/30">
                {initials}
              </div>
              <span className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-emerald-500 border-4 border-neutral-900 flex items-center justify-center" title="Verified">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </span>
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">{displayName}</h1>
              <p className="text-white/60 mb-5 flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1.5 bg-accent/15 text-accent text-xs font-bold rounded-full border border-accent/30">
                  ✈️ CPL Aspirant
                </span>
                <span className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-bold rounded-full border border-white/20 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Member since {joinDate}
                </span>
                {stats.totalTestsTaken > 0 && (
                  <span className="px-3 py-1.5 bg-violet/15 text-violet text-xs font-bold rounded-full border border-violet/30">
                    🎯 {stats.totalTestsTaken} test{stats.totalTestsTaken === 1 ? '' : 's'} taken
                  </span>
                )}
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white border border-white/20 hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all text-sm font-semibold backdrop-blur-md"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Tests Purchased"
            value={String(stats.totalPurchases)}
            tint="text-emerald-700 bg-emerald-50"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Avg. RTR Score"
            value={stats.avgRtr === null ? '—' : `${stats.avgRtr}%`}
            tint="text-blue-700 bg-blue-50"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Avg. Aptitude"
            value={stats.avgAptitude === null ? '—' : `${stats.avgAptitude}%`}
            tint="text-violet bg-violet/10"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Practice Time"
            value={stats.totalMinutes > 0 ? `${stats.totalMinutes} min` : '—'}
            tint="text-orange-700 bg-orange-50"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-2 shadow-sm sticky top-24 z-10 backdrop-blur-md bg-white/95">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                  tab === t.id
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {tab === 'overview' && (
            <OverviewTab
              displayName={displayName}
              rtrResults={rtrResults}
              aptitudeResults={aptitudeResults}
              examAttempts={examAttempts}
              purchases={purchases}
              examRegistrations={examRegistrations}
              avgExam={stats.avgExam}
              onJump={(t) => setTab(t)}
            />
          )}
          {tab === 'tests' && (
            <TestsTab purchases={purchases} examRegistrations={examRegistrations} />
          )}
          {tab === 'results' && (
            <ResultsTab
              rtrResults={rtrResults}
              aptitudeResults={aptitudeResults}
              examAttempts={examAttempts}
            />
          )}
          {tab === 'settings' && (
            <SettingsTab user={user} profile={profile} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Stat card ---------- */

function StatCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint}`}>
        {icon}
      </div>
      <p className="text-2xl md:text-3xl font-black text-neutral-900 leading-none mb-2 truncate">{value}</p>
      <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

/* ---------- Overview ---------- */

function OverviewTab({
  displayName,
  rtrResults,
  aptitudeResults,
  examAttempts,
  purchases,
  examRegistrations,
  avgExam,
  onJump,
}: {
  displayName: string;
  rtrResults: RTRResult[];
  aptitudeResults: AptitudeResult[];
  examAttempts: ExamAttempt[];
  purchases: Purchase[];
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
    icon: React.ReactNode;
    accent: string;
    pct?: number;
    score?: string;
  };

  const activity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    rtrResults.forEach((r) => {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      items.push({
        id: `rtr-${r.id}`,
        title: r.rtr_tests?.title ?? 'RTR Test',
        subtitle: r.part === 'part1' ? 'DGCA RTR · Part 1 (MCQ)' : 'DGCA RTR · Part 2 (RT)',
        date: formatDate(r.created_at),
        iso: r.created_at,
        icon: <Target className="w-4 h-4" />,
        accent: 'bg-blue-50 text-blue-600',
        pct,
        score: `${r.score}/${r.total}`,
      });
    });

    aptitudeResults.forEach((r) => {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      items.push({
        id: `apt-${r.id}`,
        title: r.category,
        subtitle: 'Pilot Aptitude',
        date: formatDate(r.created_at),
        iso: r.created_at,
        icon: <Trophy className="w-4 h-4" />,
        accent: 'bg-violet/10 text-violet',
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
          icon: <GraduationCap className="w-4 h-4" />,
          accent: 'bg-emerald-50 text-emerald-600',
          pct,
          score: `${score}/${total}`,
        });
      });

    items.sort((a, b) => +new Date(b.iso) - +new Date(a.iso));
    return items.slice(0, 8);
  }, [rtrResults, aptitudeResults, examAttempts]);

  const upcoming = examRegistrations.filter((r) => {
    if (!r.exams?.exam_date) return false;
    const examDate = new Date(r.exams.exam_date);
    return examDate >= new Date(new Date().toDateString());
  });

  const isEmpty =
    rtrResults.length === 0 &&
    aptitudeResults.length === 0 &&
    examAttempts.length === 0 &&
    purchases.length === 0 &&
    examRegistrations.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-white border border-neutral-100 rounded-[2rem] p-12 md:p-16 shadow-sm text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent/20 to-violet/20 flex items-center justify-center text-4xl">
          🚀
        </div>
        <h3 className="text-2xl font-black text-neutral-900 mb-3">Welcome aboard, {displayName}!</h3>
        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
          Your training journey starts here. Take a free aptitude test, study from our guides, or unlock the DGCA RTR mock tests.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button href="/pilot-aptitude">Take Aptitude Test</Button>
          <Button variant="violet" href="/dgca-rtr">Browse RTR Tests</Button>
          <Button variant="secondary" href="/guides">Read Guides</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Recent Activity */}
      <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" /> Recent Activity
          </h2>
          {activity.length > 0 && (
            <button
              onClick={() => onJump('results')}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {activity.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 text-sm mb-4">No test activity yet.</p>
            <Button size="sm" href="/pilot-aptitude">Start practicing</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.accent}`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-900 truncate">{a.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{a.subtitle} · {a.date}</p>
                </div>
                {a.pct !== undefined && (
                  <div className="text-right">
                    <p className={`text-lg font-black ${pctColor(a.pct)}`}>{a.pct}%</p>
                    <p className="text-[10px] text-neutral-400 font-medium">{a.score}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side column */}
      <div className="space-y-6">

        {/* Upcoming exams */}
        <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-base font-black text-neutral-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet" /> Upcoming
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-neutral-400 text-sm">No upcoming exam registrations.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((reg) => (
                <div key={reg.id} className="p-3 rounded-xl bg-violet/5 border border-violet/10">
                  <p className="font-bold text-sm text-neutral-900 truncate">{reg.exams?.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {reg.exams?.exam_date ? formatDate(reg.exams.exam_date) : 'TBA'}
                    {reg.exams?.exam_time ? ` · ${reg.exams.exam_time}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-base font-black text-neutral-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/pilot-aptitude" className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
              <span className="text-sm font-bold text-neutral-700 group-hover:text-neutral-900">Take aptitude test</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-accent transition-colors" />
            </Link>
            <Link href="/dgca-rtr" className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
              <span className="text-sm font-bold text-neutral-700 group-hover:text-neutral-900">Browse RTR tests</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-accent transition-colors" />
            </Link>
            <Link href="/pariksha" className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
              <span className="text-sm font-bold text-neutral-700 group-hover:text-neutral-900">View Pariksha exams</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-accent transition-colors" />
            </Link>
            <Link href="/guides" className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
              <span className="text-sm font-bold text-neutral-700 group-hover:text-neutral-900">Read study guides</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-accent transition-colors" />
            </Link>
          </div>
        </div>

        {/* Pariksha summary */}
        {avgExam !== null && (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-[2rem] p-6 shadow-sm">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Pariksha Average</p>
            <p className={`text-4xl font-black ${pctColor(avgExam)}`}>{avgExam}%</p>
            <p className="text-xs text-emerald-700/70 mt-2">Across all submitted exams</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- My Tests ---------- */

function TestsTab({ purchases, examRegistrations }: { purchases: Purchase[]; examRegistrations: ExamRegistration[] }) {
  return (
    <div className="space-y-6">

      {/* RTR Purchases */}
      <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" /> Purchased RTR Tests
          </h2>
          <span className="text-xs font-bold text-neutral-400">{purchases.length} test{purchases.length === 1 ? '' : 's'}</span>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-2xl">
            <Receipt className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-5">You haven&apos;t purchased any RTR tests yet.</p>
            <Button size="sm" href="/dgca-rtr">Browse RTR Tests</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => (
              <div key={p.id} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-black text-neutral-900">{p.rtr_tests?.title ?? p.test_id}</p>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                        OWNED
                      </span>
                    </div>
                    {p.rtr_tests?.description && (
                      <p className="text-xs text-neutral-500 mt-1">{p.rtr_tests.description}</p>
                    )}
                    <p className="text-[11px] text-neutral-400 mt-2">
                      Purchased {formatDate(p.purchased_at)} · ₹{p.amount}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" href={`/rtr-exam?testId=${p.test_id}&part=part1`}>
                    <PlayCircle className="w-4 h-4" /> Part 1 — MCQ
                  </Button>
                  <Button size="sm" variant="violet" href={`/rtr-exam?testId=${p.test_id}&part=part2&mode=practice`}>
                    Part 2 — Practice
                  </Button>
                  <Button size="sm" variant="dark" href={`/rtr-exam?testId=${p.test_id}&part=part2&mode=simulate`}>
                    Part 2 — Simulate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam Registrations */}
      <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-violet" /> Pariksha Registrations
          </h2>
          <span className="text-xs font-bold text-neutral-400">{examRegistrations.length} exam{examRegistrations.length === 1 ? '' : 's'}</span>
        </div>

        {examRegistrations.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-2xl">
            <GraduationCap className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-5">No Pariksha exam registrations yet.</p>
            <Button size="sm" variant="violet" href="/pariksha">View Pariksha</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {examRegistrations.map((reg) => {
              const examDate = reg.exams?.exam_date ? new Date(reg.exams.exam_date) : null;
              const isPast = examDate ? examDate < new Date(new Date().toDateString()) : false;
              return (
                <div key={reg.id} className="flex items-center justify-between gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-neutral-900">{reg.exams?.title ?? reg.exam_id}</p>
                      {isPast ? (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-bold rounded-full">PAST</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-violet/10 text-violet text-[10px] font-bold rounded-full border border-violet/20">UPCOMING</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {reg.exams?.subject}
                      {examDate ? ` · ${formatDate(examDate.toISOString())}` : ''}
                      {reg.exams?.exam_time ? ` · ${reg.exams.exam_time}` : ''}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">Registered {formatDate(reg.registered_at)}</p>
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

/* ---------- Results ---------- */

function ResultsTab({
  rtrResults,
  aptitudeResults,
  examAttempts,
}: {
  rtrResults: RTRResult[];
  aptitudeResults: AptitudeResult[];
  examAttempts: ExamAttempt[];
}) {
  const [filter, setFilter] = useState<'all' | 'rtr' | 'aptitude' | 'pariksha'>('all');

  const submittedExams = examAttempts.filter((a) => a.submitted_at && a.total && a.score !== null);

  const filters = [
    { id: 'all' as const, label: 'All', count: rtrResults.length + aptitudeResults.length + submittedExams.length },
    { id: 'rtr' as const, label: 'DGCA RTR', count: rtrResults.length },
    { id: 'aptitude' as const, label: 'Aptitude', count: aptitudeResults.length },
    { id: 'pariksha' as const, label: 'Pariksha', count: submittedExams.length },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-2 shadow-sm flex gap-1 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-accent text-black'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            {f.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              filter === f.id ? 'bg-black/10 text-black' : 'bg-neutral-100 text-neutral-500'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {(filter === 'all' || filter === 'rtr') && rtrResults.length > 0 && (
        <ResultGroup title="DGCA RTR Results" icon={<Target className="w-5 h-5 text-blue-600" />} count={rtrResults.length}>
          {rtrResults.map((r) => {
            const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
            return (
              <ResultRow
                key={r.id}
                title={r.rtr_tests?.title ?? r.test_id}
                subtitle={`${r.part === 'part1' ? 'Part 1 — MCQ' : 'Part 2 — RT'} · ${formatDate(r.created_at)}`}
                pct={pct}
                score={`${r.score}/${r.total}`}
              />
            );
          })}
        </ResultGroup>
      )}

      {(filter === 'all' || filter === 'aptitude') && aptitudeResults.length > 0 && (
        <ResultGroup title="Aptitude Results" icon={<Trophy className="w-5 h-5 text-violet" />} count={aptitudeResults.length}>
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

      {(filter === 'all' || filter === 'pariksha') && submittedExams.length > 0 && (
        <ResultGroup title="Pariksha Results" icon={<GraduationCap className="w-5 h-5 text-emerald-600" />} count={submittedExams.length}>
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
              />
            );
          })}
        </ResultGroup>
      )}

      {/* Empty state for current filter */}
      {((filter === 'rtr' && rtrResults.length === 0) ||
        (filter === 'aptitude' && aptitudeResults.length === 0) ||
        (filter === 'pariksha' && submittedExams.length === 0) ||
        (filter === 'all' &&
          rtrResults.length === 0 &&
          aptitudeResults.length === 0 &&
          submittedExams.length === 0)) && (
        <div className="bg-white border border-neutral-100 rounded-[2rem] p-12 shadow-sm text-center">
          <Award className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-6">No results to show for this category yet.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="sm" href="/pilot-aptitude">Take Aptitude</Button>
            <Button size="sm" variant="violet" href="/dgca-rtr">RTR Tests</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
          {icon} {title}
        </h2>
        <span className="text-xs font-bold text-neutral-400">{count} attempt{count === 1 ? '' : 's'}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ResultRow({ title, subtitle, pct, score }: { title: string; subtitle: string; pct: number; score: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900 truncate">{title}</p>
        <p className="text-xs text-neutral-400 mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:block w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-black border ${pctBadge(pct)}`}>{pct}%</div>
        <span className="hidden md:inline text-[11px] text-neutral-400 font-medium tabular-nums w-12 text-right">{score}</span>
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsTab({ user, profile }: { user: UserSummary; profile: Profile | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <EditProfileForm user={user} profile={profile} />
      <ChangePasswordForm />

      {/* Account info */}
      <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-black text-neutral-900 mb-6 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-neutral-500" /> Account Information
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoRow icon={<Mail className="w-5 h-5 text-blue-500" />} tint="bg-blue-50" label="Email Address" value={user.email} />
          <InfoRow icon={<Calendar className="w-5 h-5 text-emerald-500" />} tint="bg-emerald-50" label="Member Since" value={formatDate(user.created_at, { day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow icon={<ShieldCheck className="w-5 h-5 text-violet" />} tint="bg-violet/10" label="User ID" value={user.id} mono />
          <InfoRow icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} tint="bg-emerald-50" label="Account Status" value="Verified · Active" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, tint, label, value, mono = false }: { icon: React.ReactNode; tint: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-neutral-900 font-semibold truncate ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</p>
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
    <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
      <h2 className="text-lg font-black text-neutral-900 mb-1 flex items-center gap-2">
        <Pencil className="w-5 h-5 text-accent" /> Profile Details
      </h2>
      <p className="text-sm text-neutral-500 mb-6">Update how your name appears on the platform.</p>

      <form action={action} className="space-y-4">
        <Input
          label="Full Name"
          name="full_name"
          type="text"
          placeholder="Capt. R. Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="px-4 py-3 rounded-xl border-2 border-neutral-100 bg-neutral-50 text-neutral-400 text-sm cursor-not-allowed"
          />
          <p className="text-[11px] text-neutral-400">Contact support to change your email.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {message && (
          <div className="flex items-start gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {message}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
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
    // On success the action redirects to /login — only error returns here
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
      <h2 className="text-lg font-black text-neutral-900 mb-1 flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-violet" /> Change Password
      </h2>
      <p className="text-sm text-neutral-500 mb-6">You&apos;ll be signed out and asked to log in again.</p>

      <form action={action} className="space-y-4">
        <Input
          label="New Password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          required
          minLength={6}
          autoComplete="new-password"
        />

        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <Button type="submit" variant="violet" disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}
