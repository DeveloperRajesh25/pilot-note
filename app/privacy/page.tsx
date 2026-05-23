import React from 'react';
import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '@/components/layout/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — Pilot Note',
  description:
    'How Pilot Note collects, uses, stores, and protects the personal information of student pilots using our platform.',
};

const TOC = [
  { id: 'introduction',     label: '1. Introduction' },
  { id: 'information',      label: '2. Information we collect' },
  { id: 'use',              label: '3. How we use information' },
  { id: 'cookies',          label: '4. Cookies & tracking' },
  { id: 'sharing',          label: '5. Sharing of information' },
  { id: 'storage',          label: '6. Data storage & security' },
  { id: 'rights',           label: '7. Your rights' },
  { id: 'children',         label: '8. Children’s privacy' },
  { id: 'retention',        label: '9. Data retention' },
  { id: 'thirdparty',       label: '10. Third-party services' },
  { id: 'changes',          label: '11. Changes to this policy' },
  { id: 'contact',          label: '12. Contact us' },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={<>Privacy <span className="italic-serif">Policy</span></>}
      lastUpdated="23 May 2026"
      toc={TOC}
      intro={
        <p>
          This Privacy Policy explains what information Pilot Note collects when you use our website
          and services, why we collect it, and the choices you have. We’ve tried to write it in plain
          English — if anything is unclear, please reach out.
        </p>
      }
    >
      <LegalSection id="introduction" title="1. Introduction">
        <p>
          Pilot Note (“we”, “us”, or “our”) operates the website at pilotnote.in and related
          services (collectively, the “Platform”). We are committed to protecting the personal
          information of student pilots and visitors who use the Platform.
        </p>
        <p>
          By accessing or using the Platform, you agree to the collection and use of information
          in accordance with this Policy.
        </p>
      </LegalSection>

      <LegalSection id="information" title="2. Information we collect">
        <p>We collect the following categories of information:</p>
        <ul>
          <li><strong>Account information:</strong> name, email address, password (encrypted), and optional details such as date of birth, phone number, and city.</li>
          <li><strong>Profile information:</strong> flying school, training stage, target CPL date, and other onboarding fields you choose to provide.</li>
          <li><strong>Usage data:</strong> exam attempts, scores, time spent, questions answered, study patterns, and feature interactions.</li>
          <li><strong>Payment information:</strong> we use third-party payment processors (such as Razorpay) and do <strong>not</strong> store full card numbers on our servers. We retain transaction IDs, amounts, and order references.</li>
          <li><strong>Device & log data:</strong> IP address, browser type, operating system, device identifiers, and referring URLs.</li>
          <li><strong>Communications:</strong> messages you send us via email, contact forms, or support channels.</li>
        </ul>
      </LegalSection>

      <LegalSection id="use" title="3. How we use information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, operate, and maintain the Platform and your account.</li>
          <li>Personalize study recommendations, mock-exam matchmaking, and progress tracking.</li>
          <li>Process payments for paid mock exams and premium content.</li>
          <li>Send transactional emails (order confirmations, exam reminders, security alerts).</li>
          <li>Send optional product updates and announcements, which you may unsubscribe from at any time.</li>
          <li>Detect, investigate, and prevent fraudulent activity, exam malpractice, or unauthorized access.</li>
          <li>Comply with applicable Indian laws and respond to lawful requests by public authorities.</li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" title="4. Cookies & tracking">
        <p>
          We use cookies and similar technologies (such as <code>localStorage</code> and session
          tokens) to keep you signed in, remember your preferences, and understand how the Platform is
          used. You can disable cookies in your browser, but some features — including login — may
          stop working.
        </p>
        <p>
          We use privacy-respecting analytics to measure aggregate platform usage. We do not sell
          your browsing data to advertisers.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="5. Sharing of information">
        <p>We do not sell your personal information. We share data only:</p>
        <ul>
          <li><strong>With service providers</strong> who help us run the Platform (hosting, email delivery, payment processing, analytics) — bound by confidentiality obligations.</li>
          <li><strong>For legal reasons</strong> when required by court order, subpoena, or other lawful request from Indian authorities.</li>
          <li><strong>In the event of a business transfer</strong> (merger, acquisition, or sale of assets), in which case we will notify you in advance.</li>
          <li><strong>With your consent</strong>, for any other purpose disclosed to you at the time of collection.</li>
        </ul>
      </LegalSection>

      <LegalSection id="storage" title="6. Data storage & security">
        <p>
          Your data is stored on secure servers hosted in India and other jurisdictions where our
          cloud providers operate. We use industry-standard practices including TLS encryption in
          transit, hashed passwords, role-based access control, and regular backups.
        </p>
        <p>
          No method of transmission or storage is 100% secure. While we strive to protect your
          information, we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="7. Your rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Correct or update inaccurate information through your profile, or by contacting us.</li>
          <li>Request deletion of your account and associated personal data.</li>
          <li>Withdraw consent for optional marketing communications at any time.</li>
          <li>Lodge a complaint with the relevant data protection authority.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <strong>privacy@pilotnote.in</strong>.
        </p>
      </LegalSection>

      <LegalSection id="children" title="8. Children’s privacy">
        <p>
          The Platform is intended for users aged 16 and above. We do not knowingly collect personal
          information from children under 16. If you believe a minor has provided us with personal
          data without parental consent, please contact us and we will promptly delete it.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="9. Data retention">
        <p>
          We retain your account information for as long as your account is active. If you delete
          your account, we delete your personal information within 30 days, except where retention is
          required for legal, accounting, or fraud-prevention purposes (such as payment records,
          which we retain for up to 8 years as required by Indian tax law).
        </p>
      </LegalSection>

      <LegalSection id="thirdparty" title="10. Third-party services">
        <p>
          The Platform may link to or use third-party services such as Razorpay (payments), Google
          Fonts, Supabase (authentication & database), and analytics providers. These services have
          their own privacy policies and we recommend reviewing them.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated
          via email or a prominent notice on the Platform. Continued use of the Platform after
          changes take effect constitutes your acceptance of the revised Policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="12. Contact us">
        <p>
          If you have any questions about this Privacy Policy or how we handle your data, please
          contact us:
        </p>
        <ul>
          <li>Email: <strong>privacy@pilotnote.in</strong></li>
          <li>General contact: <strong>support@pilotnote.in</strong></li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
