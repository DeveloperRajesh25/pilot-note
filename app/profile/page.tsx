import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, Mail, Shield, LogOut, BookOpen, Target, Trophy, Calendar } from 'lucide-react';

interface RTRResult {
  id: string;
  test_id: string;
  part: string;
  score: number;
  total: number;
  created_at: string;
  rtr_tests?: { title: string };
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
  rtr_tests?: { title: string; description: string };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all user data
  const [profileRes, purchasesRes, rtrResultsRes, aptitudeResultsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_purchases').select('*, rtr_tests(title, description)').eq('user_id', user.id).order('purchased_at', { ascending: false }),
    supabase.from('rtr_results').select('*, rtr_tests(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('aptitude_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ]);

  const profile = profileRes.data;
  const purchases: Purchase[] = purchasesRes.data ?? [];
  const rtrResults: RTRResult[] = rtrResultsRes.data ?? [];
  const aptitudeResults: AptitudeResult[] = aptitudeResultsRes.data ?? [];

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Pilot';
  const joinDate = new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Profile Header Card */}
          <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-24 h-24 bg-violet/10 rounded-full flex items-center justify-center border-4 border-violet/20 flex-shrink-0">
                <User className="w-12 h-12 text-violet" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-black text-neutral-900 mb-1">{displayName}</h1>
                <p className="text-neutral-500 mb-4">Member since {joinDate}</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <span className="px-3 py-1.5 bg-violet/10 text-violet text-xs font-bold rounded-full border border-violet/20">
                    ✈️ CPL Aspirant
                  </span>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    ✓ Verified
                  </span>
                </div>
              </div>
              <form action={signOut}>
                <Button type="submit" variant="secondary" className="flex items-center gap-2 text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <BookOpen className="w-5 h-5" />, label: 'RTR Tests Purchased', value: purchases.length, color: 'text-green-600 bg-green-50' },
              { icon: <Target className="w-5 h-5" />, label: 'RTR Attempts', value: rtrResults.length, color: 'text-blue-600 bg-blue-50' },
              { icon: <Trophy className="w-5 h-5" />, label: 'Aptitude Tests', value: aptitudeResults.length, color: 'text-violet bg-violet/10' },
              { icon: <Calendar className="w-5 h-5" />, label: 'Member Since', value: joinDate, color: 'text-orange-600 bg-orange-50', isText: true },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  {stat.icon}
                </div>
                <p className={`font-black mb-1 ${stat.isText ? 'text-lg' : 'text-3xl'} text-neutral-900`}>{stat.value}</p>
                <p className="text-xs text-neutral-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Account Details */}
          <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm">
            <h2 className="text-lg font-black text-neutral-900 mb-6">Account Details</h2>
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 font-medium mb-0.5">Email Address</p>
                  <p className="text-neutral-900 font-semibold">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 font-medium mb-0.5">User ID</p>
                  <p className="text-neutral-700 font-mono text-xs">{user.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RTR Purchases */}
          {purchases.length > 0 && (
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-lg font-black text-neutral-900 mb-6">Purchased Tests</h2>
              <div className="space-y-4">
                {purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div>
                      <p className="font-bold text-neutral-900">{p.rtr_tests?.title ?? p.test_id}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Purchased {new Date(p.purchased_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-600">₹{p.amount}</span>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent RTR Results */}
          {rtrResults.length > 0 && (
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-lg font-black text-neutral-900 mb-6">Recent RTR Results</h2>
              <div className="space-y-4">
                {rtrResults.map((r) => {
                  const pct = Math.round((r.score / r.total) * 100);
                  return (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div>
                        <p className="font-bold text-neutral-900">{r.rtr_tests?.title ?? r.test_id}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {r.part === 'part1' ? 'Part 1 — MCQ' : 'Part 2 — RT'} · {new Date(r.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${pct >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{pct}%</p>
                        <p className="text-xs text-neutral-400">{r.score}/{r.total}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Aptitude Results */}
          {aptitudeResults.length > 0 && (
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-lg font-black text-neutral-900 mb-6">Recent Aptitude Tests</h2>
              <div className="space-y-4">
                {aptitudeResults.map((r) => {
                  const pct = Math.round((r.score / r.total) * 100);
                  return (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div>
                        <p className="font-bold text-neutral-900">{r.category}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {new Date(r.created_at).toLocaleDateString('en-IN')} · {Math.floor(r.time_taken / 60)}m {r.time_taken % 60}s
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{pct}%</p>
                        <p className="text-xs text-neutral-400">{r.score}/{r.total}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {purchases.length === 0 && rtrResults.length === 0 && aptitudeResults.length === 0 && (
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-16 shadow-sm text-center">
              <p className="text-5xl mb-4">🚀</p>
              <h3 className="text-xl font-black text-neutral-900 mb-3">Start Your Journey</h3>
              <p className="text-neutral-500 mb-8">Take an aptitude test or purchase a DGCA RTR mock test to see your progress here.</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button href="/pilot-aptitude">Take Aptitude Test</Button>
                <Button variant="secondary" href="/dgca-rtr">Browse RTR Tests</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
