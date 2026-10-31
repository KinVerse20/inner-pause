import type { Metadata } from "next";
import Link from "next/link";

import { OPERATOR_COUNTRY, OPERATOR_NAME, PASS_DAYS, PASS_PRICE_INR } from "@inner-pause/shared";

import { LegalPage, SupportEmail, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service · Inner Pause" };

const sections: LegalSection[] = [
  {
    heading: "What Inner Pause is",
    body: (
      <p>
        Inner Pause offers short guided pauses, sound, reflection and practice for everyday wellbeing. It&apos;s a self-care tool, not a
        medical service.
      </p>
    ),
  },
  {
    heading: "Not medical advice, and help in a crisis",
    body: (
      <>
        <p>
          Inner Pause doesn&apos;t diagnose, treat or cure any condition, and it isn&apos;t a substitute for professional care. What it
          says about chakras and frequencies describes traditional associations, not medical or scientific claims.
        </p>
        <p>
          If you&apos;re in crisis or thinking about harming yourself, please call emergency services on <strong>112</strong>, or Tele
          MANAS, India&apos;s free mental health helpline, on <strong>14416</strong> or <strong>1-800-891-4416</strong>.
        </p>
      </>
    ),
  },
  {
    heading: "Who can use it",
    body: <p>You must be 18 or older to use Inner Pause.</p>,
  },
  {
    heading: "Your account",
    body: (
      <p>
        You don&apos;t need an account to use most of Inner Pause. If you create one, keep your details accurate and your password private;
        you&apos;re responsible for what happens under your account. Tell us straight away if you think someone else has used it.
      </p>
    ),
  },
  {
    heading: "The Inner Pause Pass",
    body: (
      <ul>
        <li>
          The Pass costs ₹{PASS_PRICE_INR}, inclusive of applicable taxes, and gives you the Pass features for {PASS_DAYS} days from
          purchase.
        </li>
        <li>It&apos;s a one-time payment, not a subscription. It never renews or charges you again by itself.</li>
        <li>Buying again while your Pass is active adds {PASS_DAYS} days after its current end.</li>
        <li>The Pass is linked to your account. Payments are processed by Razorpay.</li>
        <li>
          Refunds follow our{" "}
          <Link href="/refund-policy" className="underline underline-offset-2" style={{ color: "var(--ds-accent)" }}>
            Refund and cancellation policy
          </Link>
          .
        </li>
        <li>We may change the price for future purchases. A Pass you&apos;ve already bought is never affected.</li>
      </ul>
    ),
  },
  {
    heading: "Using Inner Pause fairly",
    body: (
      <p>
        Please don&apos;t misuse Inner Pause: don&apos;t try to break, overload or get around its security, access other people&apos;s
        accounts or data, copy or resell the app or its content, or use it for anything unlawful.
      </p>
    ),
  },
  {
    heading: "Your content and ours",
    body: (
      <p>
        What you write in Inner Pause stays yours. The app itself, including its sounds, text and design, belongs to us or our licensors,
        and you may use it for your own personal, non-commercial wellbeing.
      </p>
    ),
  },
  {
    heading: "Changes to Inner Pause",
    body: (
      <p>
        We keep improving Inner Pause, so features may change. If we stop offering a Pass feature you&apos;ve paid for before your Pass ends,
        we&apos;ll offer a fair refund for the unused time.
      </p>
    ),
  },
  {
    heading: "Our responsibility",
    body: (
      <p>
        We work to keep Inner Pause reliable, but it&apos;s provided as it is, without guarantees that it will always be available or free
        of errors. To the extent the law allows, our total responsibility to you for any claim is limited to the amount you paid us in the
        12 months before it. Nothing in these terms limits rights you have under consumer law that can&apos;t be limited.
      </p>
    ),
  },
  {
    heading: "Ending",
    body: (
      <p>
        You can stop using Inner Pause and delete your account at any time (You → Data &amp; Privacy). We may suspend an account that seriously
        breaks these terms, and we&apos;ll tell you why.
      </p>
    ),
  },
  {
    heading: "Law and disputes",
    body: (
      <p>
        These terms are governed by the laws of {OPERATOR_COUNTRY}, and the courts of {OPERATOR_COUNTRY} have jurisdiction. If you have a
        problem, please write to us first; most things can be sorted out quickly.
      </p>
    ),
  },
  {
    heading: "Changes to these terms",
    body: (
      <p>
        If we change these terms in an important way, we&apos;ll update the date above and let you know in the app before the changes
        apply.
      </p>
    ),
  },
  {
    heading: "Contact",
    body: (
      <p>
        Inner Pause is operated by {OPERATOR_NAME} in {OPERATOR_COUNTRY}. Write to <SupportEmail />.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      current="/terms"
      intro={
        <p>
          These terms are an agreement between you and {OPERATOR_NAME}, who operates Inner Pause in {OPERATOR_COUNTRY}. By using Inner Pause,
          you agree to them. If you don&apos;t agree, please don&apos;t use the app.
        </p>
      }
      sections={sections}
    />
  );
}
