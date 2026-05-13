import crypto from 'node:crypto';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function basicAuthHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) {
    throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment');
  }
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

export interface CreateOrderInput {
  amount: number;        // rupees
  currency?: string;     // default INR
  receipt: string;       // max 40 chars, unique per attempt
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number;        // paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: 'created' | 'attempted' | 'paid';
  notes: Record<string, string>;
  created_at: number;
}

export async function createOrder(input: CreateOrderInput): Promise<RazorpayOrder> {
  const body = {
    amount: Math.round(input.amount * 100),     // paise
    currency: input.currency ?? 'INR',
    receipt: input.receipt.slice(0, 40),
    notes: input.notes ?? {},
  };

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order create failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<RazorpayOrder>;
}

/**
 * Verifies a Razorpay checkout success payload by recomputing the HMAC.
 * https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/
 */
export function verifyPaymentSignature(args: {
  order_id: string;
  payment_id: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Missing RAZORPAY_KEY_SECRET');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${args.order_id}|${args.payment_id}`)
    .digest('hex');
  // timingSafeEqual requires equal length buffers.
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(args.signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies an incoming Razorpay webhook against the raw request body.
 * Pass the body string EXACTLY as received (do not JSON.parse-then-stringify).
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('Missing RAZORPAY_WEBHOOK_SECRET');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
