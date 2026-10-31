import type { Metadata } from "next";

import { PASS_DAYS, PASS_PRICE_INR } from "@inner-pause/shared";

import { LegalPage, SupportEmail, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund and cancellation policy · Inner Pause" };

const sections: LegalSection[] = [
  {
    heading: "Delivery",
    body: (
      <p>
        The Pass is a digital service. It&apos;s added to your account as soon as your payment is confirmed, usually within seconds.
        Nothing is shipped.
      </p>
    ),
  },
  {
    heading: "Cancellation",
    body: (
      <p>
        The Pass isn&apos;t a subscription, so there&apos;s nothing to cancel: it never renews or charges you again. It simply ends after{" "}
        {PASS_DAYS} days.
      </p>
    ),
  },
  {
    heading: "Refunds",
    body: (
      <>
        <p>We refund your payment in full if:</p>
        <ul>
          <li>you were charged more than once for the same purchase;</li>
          <li>you were charged but the Pass wasn&apos;t added to your account, and we can&apos;t fix it;</li>
          <li>a problem on our side stops the Pass features from working, and we can&apos;t fix it within 7 days of you telling us.</li>
        </ul>
        <p>
          Otherwise, because the Pass starts straight away, payments aren&apos;t refundable once it&apos;s active, except where the law
          requires a refund.
        </p>
      </>
    ),
  },
  {
    heading: "How to ask for a refund",
    body: (
      <p>
        Write to <SupportEmail /> within 7 days of your payment, with your account email and the payment reference from your Razorpay
        receipt. We reply within 3 working days.
      </p>
    ),
  },
  {
    heading: "How refunds are paid",
    body: (
      <p>
        Approved refunds go back to the way you paid, through Razorpay. They usually arrive within 5 to 7 working days, depending on your
        bank.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund and cancellation policy"
      current="/refund-policy"
      intro={
        <p>
          This policy covers the Inner Pause Pass: a one-time payment of ₹{PASS_PRICE_INR} for {PASS_DAYS} days of Pass features.
        </p>
      }
      sections={sections}
    />
  );
}
