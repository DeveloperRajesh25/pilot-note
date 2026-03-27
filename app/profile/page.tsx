import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-950 pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 md:p-12 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center border-4 border-accent/20">
                <User className="w-12 h-12 text-accent" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">User Profile</h1>
                <p className="text-neutral-400">Manage your account settings and preferences</p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="bg-neutral-800/30 p-6 rounded-2xl border border-neutral-700/50 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500 font-medium">Email Address</p>
                  <p className="text-white font-semibold">{user.email}</p>
                </div>
              </div>

              <div className="bg-neutral-800/30 p-6 rounded-2xl border border-neutral-700/50 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500 font-medium">User ID</p>
                  <p className="text-white font-mono text-xs">{user.id}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Account Actions</h2>
                <p className="text-sm text-neutral-400">Securely sign out of your account</p>
              </div>
              <form action={signOut}>
                <Button 
                  type="submit" 
                  variant="dark" 
                  className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
