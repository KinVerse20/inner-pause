import type { Metadata } from "next";

import { OPERATOR_COUNTRY, OPERATOR_NAME } from "@inner-pause/shared";

import { LegalPage, SupportEmail, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy · Inner Pause" };

const sections: LegalSection[] = [
  {
    heading: "What stays on your device",
    body: (
      <>
        <p>
          Most of what you do in Inner Pause is saved only in the browser on your device: what you write in Tell and your Journal, your
          Moments, your Practice answers, your Pause history and your preferences. We don&apos;t receive or store these on our servers.
        </p>
        <p>
          Clearing your browser&apos;s data, or using You → Data &amp; Privacy, removes them. If you turn on offline mode, Pause sounds and
          app screens are also stored on your device.
        </p>
      </>
    ),
  },
  {
    heading: "What we collect",
    body: (
      <ul>
        <li>
          <strong>Your account</strong>, if you create one: your email address, and optionally your name and phone number, plus your
          password. Your password is stored only as a one-way hash, never in readable form.
        </li>
        <li>
          <strong>Inner Pause Pass purchases</strong>: the order and payment reference, the amount, the date and when your Pass ends.
          Payments are handled by Razorpay. We never see or store your card, UPI or bank details.
        </li>
        <li>
          <strong>Text you send to find a Pause</strong>: when you use Tell, what you write is sent to our server so it can choose a
          fitting Pause. It&apos;s used for that moment only and isn&apos;t stored on our servers.
        </li>
        <li>
          <strong>Technical information</strong>: our servers keep standard logs, such as IP address, browser type and the time of a
          request, to keep the service running and secure.
        </li>
        <li>
          <strong>One essential cookie</strong> keeps you signed in. We don&apos;t use advertising, analytics or tracking cookies.
        </li>
      </ul>
    ),
  },
  {
    heading: "How we use it",
    body: (
      <>
        <ul>
          <li>To run the app and your account, and to sign you in.</li>
          <li>To send you a link when you ask to reset your password.</li>
          <li>To take payment for the Pass, confirm it and keep it on your account.</li>
          <li>To answer you when you contact us.</li>
          <li>To keep Inner Pause secure and prevent misuse, and to meet our legal obligations.</li>
        </ul>
        <p>We don&apos;t sell your information, and we don&apos;t use it for advertising.</p>
      </>
    ),
  },
  {
    heading: "Who we share it with",
    body: (
      <>
        <p>Only with the service providers that help us run Inner Pause, for the purposes above:</p>
        <ul>
          <li>
            <strong>Razorpay</strong>, to process Pass payments.
          </li>
          <li>
            <strong>Amazon Web Services and MongoDB Atlas</strong>, which host our servers, database and files.
          </li>
          <li>
            <strong>Our email provider</strong>, to send password reset emails.
          </li>
          <li>
            <strong>OpenAI</strong>, only when AI-assisted matching is turned on: the text you share in Tell is sent to choose a Pause.
            Under OpenAI&apos;s API terms, it isn&apos;t used to train their models.
          </li>
        </ul>
        <p>
          We also share information if the law requires it. Some providers may process information outside {OPERATOR_COUNTRY}, with
          appropriate safeguards.
        </p>
      </>
    ),
  },
  {
    heading: "How long we keep it",
    body: (
      <ul>
        <li>Your account information: until you delete your account.</li>
        <li>
          Payment records: as long as the law requires, for example for tax and accounting. When you delete your account, they&apos;re
          kept without being linked to you.
        </li>
        <li>Server logs: for a limited period, then deleted.</li>
        <li>Password reset links: they stop working after 1 hour.</li>
      </ul>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <>
        <p>Under India&apos;s Digital Personal Data Protection Act, 2023, you can:</p>
        <ul>
          <li>see and correct your account information (You → Account);</li>
          <li>export the data stored on your device (You → Data &amp; Privacy → Export);</li>
          <li>
            delete your account, which removes it from our servers along with the data on that device (You → Data &amp; Privacy → Delete
            account);
          </li>
          <li>withdraw your consent at any time, by deleting your account and data;</li>
          <li>nominate someone to use these rights for you if you die or become unable to;</li>
          <li>raise a concern with us, and if you&apos;re not satisfied, with the Data Protection Board of India.</li>
        </ul>
        <p>
          To use any of these, write to <SupportEmail />. We aim to respond within 30 days.
        </p>
      </>
    ),
  },
  {
    heading: "Children",
    body: (
      <p>
        Inner Pause is for people aged 18 and over. We don&apos;t knowingly collect information from children. If you think a child has
        created an account, contact us and we&apos;ll delete it.
      </p>
    ),
  },
  {
    heading: "Security",
    body: (
      <p>
        We use encrypted connections (HTTPS), hashed passwords and restricted access to protect your information. No system is perfectly
        secure, so please choose a strong password and keep your device locked.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: <p>If we make important changes, we&apos;ll update the date above and let you know in the app before they apply.</p>,
  },
  {
    heading: "Contact and grievances",
    body: (
      <p>
        Inner Pause is operated by {OPERATOR_NAME} in {OPERATOR_COUNTRY}, who also handles privacy questions and grievances. Write to{" "}
        <SupportEmail />.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      current="/privacy-policy"
      intro={
        <p>
          Inner Pause is a wellness app operated by {OPERATOR_NAME} in {OPERATOR_COUNTRY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). This
          policy explains what information Inner Pause handles, why, and the choices you have.
        </p>
      }
      sections={sections}
    />
  );
}
