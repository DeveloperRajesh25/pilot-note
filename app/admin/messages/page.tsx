import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  created_at: string;
}

const TOPIC_LABELS: Record<string, string> = {
  support: 'Account / exam / payment',
  feedback: 'Question error / guide idea',
  partnerships: 'Partnership / press',
  privacy: 'Privacy / data / legal',
};

const TOPIC_STYLES: Record<string, string> = {
  support: 'bg-blue-50 text-blue-700 border-blue-200',
  feedback: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partnerships: 'bg-violet-50 text-violet-700 border-violet-200',
  privacy: 'bg-amber-50 text-amber-700 border-amber-200',
};

async function getMessages(): Promise<ContactMessage[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('contact_submissions')
    .select('id, name, email, topic, message, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('contact_submissions read error:', error.message);
    return [];
  }
  return (data ?? []) as ContactMessage[];
}

export default async function AdminMessagesPage() {
  const messages = await getMessages();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 mb-1">Messages</h1>
          <p className="text-neutral-500">{messages.length} contact-form submission{messages.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-20 text-center text-neutral-500">
          No messages yet. Submissions from the contact form will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900">{m.name}</p>
                  <a href={`mailto:${m.email}`} className="text-xs text-emerald-600 hover:underline break-all">
                    {m.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${TOPIC_STYLES[m.topic] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                    {TOPIC_LABELS[m.topic] ?? m.topic}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {new Date(m.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <div className="mt-4 pt-3 border-t border-neutral-100">
                <a
                  href={`mailto:${m.email}?subject=Re:%20your%20message%20to%20Pilot%20Note`}
                  className="text-xs font-bold text-neutral-900 hover:text-emerald-600 transition-colors"
                >
                  Reply →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
