/**
 * Resend-backed transactional email for Pariksha.
 *
 * Env vars required:
 *   RESEND_API_KEY            — from resend.com dashboard
 *   EMAIL_FROM                — e.g. "Pilot Note <pariksha@pilotnote.in>"
 *   NEXT_PUBLIC_SITE_URL      — used to build links in emails (no trailing slash)
 */

const RESEND_API = 'https://api.resend.com/emails';

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
}

export async function sendEmail(args: SendArgs): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Pilot Note <pariksha@pilotnote.in>';
  if (!key) return { ok: false, error: 'RESEND_API_KEY not set' };

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        reply_to: args.reply_to,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    const data = (await res.json()) as { id: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

// ───────── HTML templates ─────────

interface ExamInfo {
  title: string;
  subject: string;
  exam_date: string | null;
  start_at: string | null;
  end_at: string | null;
}

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#171717;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafafa;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e5e5e5;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 40px 8px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#737373;font-weight:500;">Pilot Note · Pariksha</p>
        </td></tr>
        ${body}
        <tr><td style="padding:24px 40px 40px;border-top:1px solid #f0f0f0;color:#a3a3a3;font-size:11px;line-height:1.6;">
          You're receiving this because you registered for an exam on pilotnote.in.<br/>
          Questions? Reply to this email or contact support@pilotnote.in.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function formatDateIST(iso: string | null): string {
  if (!iso) return 'TBA';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBA';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST';
}

export function credentialsEmailHtml(args: {
  fullName: string | null;
  rollNo: string;
  dobPasswordHint: string;     // e.g. "Your DOB (DD/MM/YYYY format, e.g. 14/03/2002)"
  exam: ExamInfo;
  loginUrl: string;
}): string {
  const body = `
    <tr><td style="padding:8px 40px 24px;">
      <h1 style="margin:8px 0 16px;font-size:28px;line-height:1.15;letter-spacing:-0.02em;color:#0a0a0a;">
        Your exam credentials
      </h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#525252;">
        ${args.fullName ? `Hi ${escapeHtml(args.fullName)},` : 'Hi,'} your registration for
        <strong>${escapeHtml(args.exam.title)}</strong> is confirmed. Use the credentials below to enter the exam.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
        style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#a3a3a3;font-weight:500;">Roll Number</p>
          <p style="margin:0;font-family:'SF Mono',Menlo,monospace;font-size:22px;font-weight:600;color:#0a0a0a;letter-spacing:0.04em;">
            ${escapeHtml(args.rollNo)}
          </p>
        </td></tr>
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#a3a3a3;font-weight:500;">Password</p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#0a0a0a;">${escapeHtml(args.dobPasswordHint)}</p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
        <tr><td style="padding:16px 20px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#047857;font-weight:600;">Exam window</p>
          <p style="margin:0;font-size:14px;color:#065f46;">
            <strong>Starts:</strong> ${formatDateIST(args.exam.start_at)}<br/>
            <strong>Ends:</strong> ${formatDateIST(args.exam.end_at)}
          </p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;">
        <a href="${args.loginUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px;">
          Login to Pariksha →
        </a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373;">
        Please log in 10 minutes before the exam starts. Use a stable internet connection,
        on a laptop/desktop if possible. The exam runs in fullscreen — switching tabs, copying
        content, or exiting fullscreen is logged and visible to administrators.
      </p>
    </td></tr>`;
  return shell('Your Pariksha credentials', body);
}

export function resultsEmailHtml(args: {
  fullName: string | null;
  rollNo: string | null;
  exam: ExamInfo;
  score: number;
  total: number;
  percentage: number;
  rank: number;
  totalCandidates: number;
  passed: boolean;
  passScore: number;
  answersUrl: string;
}): string {
  const verdictColor = args.passed ? '#10b981' : '#ef4444';
  const verdictBg = args.passed ? '#ecfdf5' : '#fef2f2';
  const verdictBorder = args.passed ? '#a7f3d0' : '#fecaca';
  const verdictLabel = args.passed ? 'PASSED' : 'NOT PASSED';
  const body = `
    <tr><td style="padding:8px 40px 24px;">
      <h1 style="margin:8px 0 16px;font-size:28px;line-height:1.15;letter-spacing:-0.02em;color:#0a0a0a;">
        Your result is here
      </h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#525252;">
        ${args.fullName ? `Hi ${escapeHtml(args.fullName)},` : 'Hi,'} here's how you did on
        <strong>${escapeHtml(args.exam.title)}</strong>.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
        style="background:${verdictBg};border:1px solid ${verdictBorder};border-radius:12px;margin-bottom:16px;">
        <tr><td style="padding:24px 24px 8px;text-align:center;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${verdictColor};font-weight:600;">${verdictLabel}</p>
          <p style="margin:0;font-size:48px;font-weight:700;color:#0a0a0a;letter-spacing:-0.02em;line-height:1;">
            ${args.percentage}%
          </p>
          <p style="margin:8px 0 16px;font-size:13px;color:#525252;">
            ${args.score} / ${args.total} correct · pass mark ${args.passScore}%
          </p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="width:50%;padding:16px 20px;background:#fafafa;border:1px solid #e5e5e5;border-radius:12px 0 0 12px;border-right:none;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#a3a3a3;font-weight:500;">All-India Rank</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:#0a0a0a;letter-spacing:-0.01em;">
              ${args.rank} <span style="font-size:13px;font-weight:400;color:#a3a3a3;">/ ${args.totalCandidates}</span>
            </p>
          </td>
          <td style="width:50%;padding:16px 20px;background:#fafafa;border:1px solid #e5e5e5;border-radius:0 12px 12px 0;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#a3a3a3;font-weight:500;">Roll Number</p>
            <p style="margin:0;font-family:'SF Mono',Menlo,monospace;font-size:14px;font-weight:600;color:#0a0a0a;letter-spacing:0.04em;">
              ${escapeHtml(args.rollNo ?? '—')}
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0;">
        <a href="${args.answersUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px;">
          View answers & explanations →
        </a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373;">
        The answer-key link shows each question, your answer, the correct answer, and an
        explanation. Available for 30 days from result release.
      </p>
    </td></tr>`;
  return shell('Your Pariksha result', body);
}
