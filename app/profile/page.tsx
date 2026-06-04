import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [
    profileRes,
    dgcaPurchasesRes,
    aptitudeResultsRes,
    examAttemptsRes,
    examRegistrationsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('dgca_chapter_purchases')
      .select('*, dgca_chapters(title, dgca_subjects(name))')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false }),
    supabase
      .from('aptitude_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('exam_attempts')
      .select('*, exams(title, subject)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('exam_registrations')
      .select('*, exams(title, subject, exam_date, exam_time, fee, status)')
      .eq('user_id', user.id)
      .order('registered_at', { ascending: false }),
  ]);

  return (
    <>
      <Header />
      <main className="grow bg-white pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 min-h-screen">
        <ProfileClient
          user={{
            id: user.id,
            email: user.email ?? '',
            created_at: user.created_at,
          }}
          profile={profileRes.data}
          dgcaPurchases={dgcaPurchasesRes.data ?? []}
          aptitudeResults={aptitudeResultsRes.data ?? []}
          examAttempts={examAttemptsRes.data ?? []}
          examRegistrations={examRegistrationsRes.data ?? []}
        />
      </main>
      <Footer />
    </>
  );
}
