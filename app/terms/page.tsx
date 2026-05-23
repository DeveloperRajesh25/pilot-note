import React from 'react';
import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/layout/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms of Use — Pilot Note',
  description:
    'The terms and conditions governing your use of Pilot Note — India’s CPL study platform.',
};

const TOC = [
  { id: 'acceptance',   label: '1. Acceptance of terms' },
  { id: 'eligibility',  label: '2. Eligibility' },
  { id: 'account',      label: '3. Your account' },
  { id: 'use',          label: '4. Acceptable use' },
  { id: 'content',      label: '5. Content & IP' },
  { id: 'exams',        label: '6. Mock exams & integrity' },
  { id: 'payments',     label: '7. Payments & pricing' },
  { id: 'disclaimer',   label: '8. Educational disclaimer' },
  { id: 'liability',    label: '9. Limitation of liability' },
  { id: 'termination',  label: '10. Termination' },
  { id: 'law',          label: '11. Governing law' },
  { id: 'changes',      label: '12. Changes to terms' },
  { id: 'contact',      label: '13. Contact' },
];

export default function TermsOfUsePage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={<>Terms of <span className="italic-serif">Use</span></>}
      lastUpdated="23 May 2026"
      toc={TOC}
      intro={
        <p>
          Please read these Terms carefully before using Pilot Note. By creating an account or
          otherwise accessing the Platform, you agree to be bound by these Terms.
        </p>
      }
    >
      <LegalSection id="acceptance" title="1. Acceptance of terms">
        <p>
          These Terms of Use (“Terms”) form a binding agreement between you and Pilot Note. By
          accessing or using our website, mobile site, or any related service (the “Platform”), you
          confirm that you have read, understood, and agree to be bound by these Terms and our{' '}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, you must not use the Platform.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <p>To use the Platform, you must:</p>
        <ul>
          <li>Be at least 16 years of age (or have parental consent if younger).</li>
          <li>Have the legal capacity to enter into a binding contract under Indian law.</li>
          <li>Not be barred from using the Platform under any applicable law.</li>
        </ul>
        <p>
          If you are accessing the Platform on behalf of an organization, you represent that you have
          authority to bind that organization to these Terms.
        </p>
      </LegalSection>

      <LegalSection id="account" title="3. Your account">
        <ul>
          <li>You are responsible for keeping your login credentials confidential.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>You must provide accurate, current, and complete information at registration, and keep it updated.</li>
          <li>You may not transfer, sell, or share your account with anyone else.</li>
          <li>Notify us immediately if you suspect any unauthorized use of your account.</li>
        </ul>
      </LegalSection>

      <LegalSection id="use" title="4. Acceptable use">
        <p>You agree NOT to:</p>
        <ul>
          <li>Copy, scrape, download, or redistribute Platform content (questions, explanations, guides) for commercial purposes or to compete with us.</li>
          <li>Use bots, scrapers, or automated tools to access the Platform.</li>
          <li>Attempt to bypass paywalls, exam lockdowns, anti-cheat controls, or any other security measures.</li>
          <li>Reverse-engineer, decompile, or otherwise attempt to extract source code.</li>
          <li>Upload viruses, malware, or any code intended to disrupt the Platform.</li>
          <li>Harass, abuse, impersonate, or harm other users or Pilot Note staff.</li>
          <li>Use the Platform for any unlawful purpose or in violation of any applicable law.</li>
        </ul>
      </LegalSection>

      <LegalSection id="content" title="5. Content & intellectual property">
        <p>
          All content on the Platform — including questions, explanations, guides, articles, audio,
          images, the Pilot Note logo and brand assets — is owned by Pilot Note or its licensors and
          is protected by Indian and international copyright and trademark laws.
        </p>
        <p>
          We grant you a limited, non-exclusive, non-transferable, revocable licence to access and
          use the Platform for your personal, non-commercial study. All other rights are reserved.
        </p>
        <p>
          Any feedback, suggestions, or content you submit to us may be used by Pilot Note without
          obligation or compensation to you.
        </p>
      </LegalSection>

      <LegalSection id="exams" title="6. Mock exams & exam integrity">
        <p>
          Pariksha mock exams and RTR practical tests are intended to simulate real DGCA conditions.
          By participating in any paid or free mock exam, you agree:
        </p>
        <ul>
          <li>Not to communicate with other test-takers, take screenshots, or use unauthorized aids during a live exam.</li>
          <li>Not to share, post, or distribute exam questions and answers publicly.</li>
          <li>To accept Pilot Note’s decision on disqualification, score adjustments, or rank in cases of suspected malpractice.</li>
        </ul>
        <p>
          Violations may result in immediate disqualification, account termination, and forfeiture of
          any fees paid, without refund.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="7. Payments & pricing">
        <ul>
          <li>Prices are listed in Indian Rupees (INR) and include applicable GST unless stated otherwise.</li>
          <li>Payments are processed by trusted third-party gateways. Pilot Note does not store full card details.</li>
          <li>We reserve the right to change prices at any time, but changes will not affect purchases already completed.</li>
          <li>Refunds are governed by our <a href="/refund-policy">Refund Policy</a>.</li>
        </ul>
      </LegalSection>

      <LegalSection id="disclaimer" title="8. Educational disclaimer">
        <p>
          Pilot Note is a private study and practice platform. We are not affiliated with the
          Directorate General of Civil Aviation (DGCA), any Flying Training Organization, or any
          airline. Our materials are prepared in good faith based on publicly available DGCA syllabi
          and exam patterns, but:
        </p>
        <ul>
          <li>We do not guarantee that you will pass any official exam.</li>
          <li>Content may not reflect the most recent regulatory changes — always cross-check with official DGCA publications.</li>
          <li>Career, medical, and training advice in our guides is general information, not professional advice. Consult qualified instructors and DGCA-approved medical examiners for decisions that affect your career.</li>
        </ul>
      </LegalSection>

      <LegalSection id="liability" title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Pilot Note, its officers, employees, and partners
          shall not be liable for any indirect, incidental, special, consequential, or punitive
          damages — including loss of profits, data, or goodwill — arising from your use of, or
          inability to use, the Platform.
        </p>
        <p>
          Our aggregate liability for any claim arising out of these Terms or your use of the
          Platform shall not exceed the amount you have paid to Pilot Note in the 12 months
          preceding the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="10. Termination">
        <p>
          We may suspend or terminate your access to the Platform at any time, with or without
          notice, if you breach these Terms or engage in conduct that we determine is harmful to the
          Platform or other users.
        </p>
        <p>
          You may stop using the Platform and request account deletion at any time. Provisions
          relating to intellectual property, disclaimer, limitation of liability, and governing law
          will survive termination.
        </p>
      </LegalSection>

      <LegalSection id="law" title="11. Governing law & jurisdiction">
        <p>
          These Terms are governed by the laws of India. Any dispute arising out of or in connection
          with these Terms shall be subject to the exclusive jurisdiction of the courts at{' '}
          <strong>Bengaluru, Karnataka, India</strong>.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to these Terms">
        <p>
          We may update these Terms from time to time. We will post the updated version on this page
          with a revised “Last updated” date. Continued use of the Platform after changes are posted
          constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact">
        <p>
          For questions about these Terms, please contact us at <strong>support@pilotnote.in</strong>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
