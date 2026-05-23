import React from 'react';
import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/layout/LegalLayout';

export const metadata: Metadata = {
  title: 'Refund Policy — Pilot Note',
  description:
    'How refunds work for Pilot Note paid mock exams, RTR practice, and other digital products.',
};

const TOC = [
  { id: 'overview',        label: '1. Overview' },
  { id: 'eligibility',     label: '2. Refund eligibility' },
  { id: 'non-refundable',  label: '3. Non-refundable items' },
  { id: 'process',         label: '4. How to request a refund' },
  { id: 'timeline',        label: '5. Processing timeline' },
  { id: 'cancellations',   label: '6. Cancellations & rescheduling' },
  { id: 'failed',          label: '7. Failed or duplicate payments' },
  { id: 'disputes',        label: '8. Disputes & chargebacks' },
  { id: 'contact',         label: '9. Contact' },
];

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={<>Refund <span className="italic-serif">Policy</span></>}
      lastUpdated="23 May 2026"
      toc={TOC}
      intro={
        <p>
          We want every student pilot on Pilot Note to feel they’ve got real value out of their
          purchase. This page explains when refunds apply, when they don’t, and how to ask for one.
        </p>
      }
    >
      <LegalSection id="overview" title="1. Overview">
        <p>
          Pilot Note offers a mix of free and paid digital products — including Pariksha all-India
          mock exams, DGCA RTR(A) mock tests, and premium study material. Because most of our paid
          content is digital and consumed immediately, our refund policy is more specific than for
          physical goods. Please read this carefully before purchasing.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Refund eligibility">
        <p>You are eligible for a full refund if:</p>
        <ul>
          <li>You purchased a Pariksha mock exam or RTR test and the exam has not yet started, and you cancel at least <strong>24 hours before</strong> the scheduled start time.</li>
          <li>The service was unavailable on the scheduled day due to a technical fault on our side (server outage, broken exam delivery), and you were unable to attempt the exam at all.</li>
          <li>You were charged due to a billing error (duplicate charge, wrong amount).</li>
          <li>You purchased the wrong product and have not yet accessed it.</li>
        </ul>
      </LegalSection>

      <LegalSection id="non-refundable" title="3. Non-refundable items">
        <p>Refunds will NOT be issued in the following cases:</p>
        <ul>
          <li>You have already started or completed the mock exam / RTR test.</li>
          <li>You missed the exam window without notice.</li>
          <li>You are dissatisfied with the difficulty, content, or your personal score on a completed exam.</li>
          <li>You were disqualified for malpractice, copying, or violating our <a href="/terms">Terms of Use</a>.</li>
          <li>Free trials, complimentary content, or items received as part of a promotion.</li>
          <li>Subscription periods that have already been consumed.</li>
        </ul>
      </LegalSection>

      <LegalSection id="process" title="4. How to request a refund">
        <p>To request a refund, email us at <strong>refunds@pilotnote.in</strong> with:</p>
        <ul>
          <li>Your registered email address.</li>
          <li>The order ID or payment reference (you’ll find this in your purchase confirmation email).</li>
          <li>A brief reason for the refund request.</li>
        </ul>
        <p>
          We may ask for additional information to verify your identity and review the case.
          Refund requests must be made within <strong>7 days</strong> of the original payment.
        </p>
      </LegalSection>

      <LegalSection id="timeline" title="5. Processing timeline">
        <p>
          Once your refund is approved, we initiate it within <strong>3 business days</strong>. The
          actual time it takes to reflect in your account depends on your bank or card issuer, and is
          typically <strong>5–10 business days</strong> for cards, and 2–5 business days for UPI/wallets.
        </p>
        <p>
          Refunds are processed to the <em>original payment method</em>. We cannot redirect refunds to
          a different card, account, or wallet.
        </p>
      </LegalSection>

      <LegalSection id="cancellations" title="6. Cancellations & rescheduling">
        <p>
          You can cancel an upcoming Pariksha mock exam from your dashboard up to 24 hours before
          the scheduled start. After that, the slot is treated as booked and is non-refundable.
        </p>
        <p>
          In exceptional cases (medical emergency, internet outage on your side), please contact
          support before or immediately after the exam window. We review such requests on a
          case-by-case basis and may offer a one-time reschedule to a future exam.
        </p>
      </LegalSection>

      <LegalSection id="failed" title="7. Failed or duplicate payments">
        <p>
          If your payment failed but money was deducted from your account, it will typically be
          auto-reversed by your bank within 5–7 business days. If it isn’t, share the payment
          reference with us and we’ll work with the payment gateway to resolve it.
        </p>
        <p>
          For duplicate payments for the same order, we will refund the duplicate amount immediately
          upon confirmation.
        </p>
      </LegalSection>

      <LegalSection id="disputes" title="8. Disputes & chargebacks">
        <p>
          We strongly prefer to resolve any issue directly with you — please reach out to support
          before raising a chargeback with your bank. Unjustified chargebacks for digital content you
          have already accessed may result in your account being suspended.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="9. Contact">
        <p>
          For all refund-related queries: <strong>refunds@pilotnote.in</strong><br />
          For general support: <strong>support@pilotnote.in</strong>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
