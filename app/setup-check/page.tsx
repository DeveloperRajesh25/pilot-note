'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function SetupCheckPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus({ error: 'Not logged in' });
        setLoading(false);
        return;
      }

      // Check role status via a dedicated API route we'll create
      const res = await fetch('/api/admin/check-auth');
      const data = await res.json();
      
      setStatus({ user, ...data });
      setLoading(false);
    }
    check();
  }, []);

  if (loading) return <div className="p-10 font-bold">Checking setup...</div>;

  return (
    <div className="p-10 bg-neutral-950 text-white min-h-screen font-mono text-sm">
      <h1 className="text-2xl font-black text-violet mb-6">Setup Diagnostics</h1>
      
      <div className="space-y-6">
        <section className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
          <h2 className="text-xs font-bold text-neutral-500 uppercase mb-2">Auth Status</h2>
          <p>Logged In: <span className={status.user ? 'text-emerald-400' : 'text-rose-400'}>{status.user ? 'YES' : 'NO'}</span></p>
          {status.user && (
            <>
              <p className="mt-1">Email: <span className="text-white">{status.user.email}</span></p>
              <p className="mt-1">User ID (UUID): <span className="text-violet font-bold select-all">{status.user.id}</span></p>
              <p className="text-[10px] text-neutral-500 mt-2 italic capitalize">Copy this ID and use it in your SQL insert command.</p>
            </>
          )}
        </section>

        <section className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
          <h2 className="text-xs font-bold text-neutral-500 uppercase mb-2">Admin Role Check</h2>
          <p>Is Admin in DB: <span className={status.isAdmin ? 'text-emerald-400' : 'text-rose-400'}>{status.isAdmin ? 'YES' : 'NO'}</span></p>
          {status.roleError && <p className="text-rose-400 mt-2 text-xs">Error: {status.roleError}</p>}
        </section>

        <section className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
          <h2 className="text-xs font-bold text-neutral-500 uppercase mb-2">Environment Status</h2>
          <p>Service Role Key: <span className={status.hasServiceKey ? 'text-emerald-400' : 'text-rose-400'}>{status.hasServiceKey ? 'CONFIGURED' : 'MISSING'}</span></p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-white mb-4">How to fix?</h2>
          <div className="bg-black p-4 rounded-xl border border-neutral-700 text-xs text-neutral-300">
            <p className="mb-2">1. Go to your Supabase SQL Editor.</p>
            <p className="mb-2">2. Run this command (ensure you replace with your ID above):</p>
            <pre className="bg-neutral-800 p-3 rounded mt-2 text-violet font-bold">
              INSERT INTO public.admin_roles (user_id){"\n"}
              VALUES ('{status.user?.id || 'YOUR-ID-HERE'}'){"\n"}
              ON CONFLICT DO NOTHING;
            </pre>
            <p className="mt-4">3. Refresh this page. If "Is Admin" turns green, try opening <a href="/admin" className="text-violet underline">/admin</a> again.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
