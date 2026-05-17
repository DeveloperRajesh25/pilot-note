'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Clock, FileText, Loader2, ShieldCheck } from 'lucide-react';

interface ExamSummary {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  fee: number;
  start_at: string | null;
  end_at: string | null;
  duration: number;
  total_questions: number;
  isRegistered?: boolean;
  status: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;        // paise
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { email?: string; name?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export default function ParikshaRegisterPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [exam, setExam] = useState<ExamSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const RAZORPAY_URL = 'https://checkout.razorpay.com/v1/checkout.js';
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_URL}"]`);
    if (existing) {
      if (window.Razorpay) {
        setSdkReady(true);
      } else {
        existing.addEventListener('load', () => setSdkReady(true), { once: true });
      }
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_URL;
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/exams', { cache: 'no-store' });
      const data = await res.json();
      if (cancelled) return;
      const found: ExamSummary | undefined = (data.exams ?? []).find((e: ExamSummary) => e.id === examId);
      if (!found) {
        toast.error('Exam not found.');
        router.replace('/pariksha');
        return;
      }
      if (found.isRegistered) {
        router.replace(`/pariksha/${examId}`);
        return;
      }
      setExam(found);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [examId, router, toast]);

  const startCheckout = useCallback(async () => {
    if (!exam || paying) return;
    if (!sdkReady || !window.Razorpay) {
      toast.warn('Payment SDK is still loading — try again in a moment.');
      return;
    }
    setPaying(true);
    try {
      const orderRes = await fetch(`/api/exams/${examId}/payment/create-order`, { method: 'POST' });
      if (orderRes.status === 401) {
        router.push(`/login?redirect=/pariksha/${examId}/register`);
        return;
      }
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        toast.error(orderData?.error ?? 'Could not start payment.');
        return;
      }
      if (orderData.alreadyPaid) {
        // Payment already cleared — just finalise registration.
        await fetch(`/api/exams/${examId}/register`, { method: 'POST' });
        router.replace(`/pariksha/${examId}`);
        return;
      }

      const rz = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Pilot Note',
        description: orderData.exam_title ?? exam.title,
        theme: { color: '#10b981' },
        handler: async (resp) => {
          try {
            const verifyRes = await fetch(`/api/exams/${examId}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resp),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              toast.error(verifyData?.error ?? 'Payment verification failed.');
              setPaying(false);
              return;
            }
            toast.success('Payment received. You are registered.');
            router.replace(`/pariksha/${examId}`);
          } catch {
            toast.error('Verification network error — contact support.');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.info('Payment cancelled.');
          },
        },
      });
      rz.open();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(msg);
      setPaying(false);
    }
  }, [exam, examId, paying, router, sdkReady, toast]);

  if (loading || !exam) {
    return (
      <>
        <Header />
        <main className="grow pt-48 flex items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto text-neutral-400 animate-spin" />
            <p className="text-neutral-500 mt-4 text-sm uppercase tracking-[0.18em]">Loading…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const startLocal = exam.start_at
    ? new Date(exam.start_at).toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : null;

  return (
    <>
      <Header />
      <main className="grow pt-36 pb-24 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
            <span className="w-6 h-px bg-neutral-900" /> Register · {exam.subject}
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-neutral-900 leading-[1.05] tracking-[-0.03em] mb-4">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="text-neutral-600 text-base mb-10 max-w-2xl">{exam.description}</p>
          )}

          <div className="border border-neutral-200 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Row icon={<Calendar className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />} label="Starts at" value={startLocal ?? '—'} />
              <Row icon={<Clock className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />} label="Duration" value={`${exam.duration} min`} />
              <Row icon={<FileText className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />} label="Questions" value={`${exam.total_questions} multiple choice`} />
              <Row icon={<ShieldCheck className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />} label="Proctoring" value="Soft — flagged to admin" />
            </div>

            <div className="flex items-end justify-between flex-wrap gap-6 pt-6 border-t border-neutral-200">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mb-1">Exam fee</p>
                <p className="font-display text-5xl text-neutral-900 leading-none tracking-tight">₹{exam.fee}</p>
                <p className="text-[11px] text-neutral-500 mt-2">One-time, per attempt. Includes result + review.</p>
              </div>
              <Button
                variant="violet"
                size="lg"
                onClick={startCheckout}
                disabled={paying || !sdkReady}
              >
                {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Pay ₹${exam.fee}`}
              </Button>
            </div>
          </div>

          <div className="mt-10 text-[11px] text-neutral-500 leading-relaxed max-w-xl">
            Payments are processed by Razorpay. Your card details never touch our servers. By
            paying, you agree to the exam terms — including soft proctoring. Refunds available
            within 24 hours of the exam window opening, contact support@pilotnote.in.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mb-1 font-medium">{label}</p>
        <p className="text-sm text-neutral-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
