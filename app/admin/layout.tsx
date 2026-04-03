import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check admin role using service role client to bypass RLS during initialization
  const adminDb = createAdminClient();
  const { data: role, error: roleError } = await adminDb
    .from('admin_roles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError || !role) {
    console.error('Admin Access Denied for:', user.email, user.id);
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
