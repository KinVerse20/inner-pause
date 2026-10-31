import { APP_NAME, SUPPORT_EMAIL } from "@inner-pause/shared";
import nodemailer, { type Transporter } from "nodemailer";

// Outgoing email over SMTP, which every provider offers: Amazon SES (on
// AWS), Resend, Postmark, SendGrid, or a Gmail/Workspace account. Configured
// with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM; until then,
// mailerConfigured() is false and nothing is sent.

let transporter: Transporter | null = null;

export function mailerConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.MAIL_FROM?.trim());
}

function getTransporter() {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 is SMTP over TLS from the start; others upgrade with STARTTLS.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
  return transporter;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export async function sendPasswordResetEmail(to: string, link: string) {
  const text = [
    `Someone asked to reset the password for your ${APP_NAME} account.`,
    "",
    "Choose a new password here (the link works for 1 hour):",
    link,
    "",
    "If this wasn't you, you can ignore this email. Your password stays the same.",
    "",
    `Questions? Write to ${SUPPORT_EMAIL}.`,
  ].join("\n");
  const html = `<p>Someone asked to reset the password for your ${APP_NAME} account.</p>
<p><a href="${escapeHtml(link)}">Choose a new password</a> (the link works for 1 hour).</p>
<p>If this wasn't you, you can ignore this email. Your password stays the same.</p>
<p>Questions? Write to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`;
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    text,
    html,
  });
}
