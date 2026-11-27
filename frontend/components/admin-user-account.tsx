"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { PassState } from "@inner-pause/shared";

import { apiFetch } from "@/lib/api";
import { formatPassDate, rupees } from "@/lib/pass-summary";

// One account in /admin: everything the server holds for it, and the
// changes support needs (name, phone, email, the Pass, the trial, a new
// password, sign out everywhere). Each change is logged with who made it
// (backend/src/routes/admin.ts PATCH /users/:id). Pauses, the journal and
// Moments live on the person's phone, so they aren't here.

interface Account {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string | null;
  signupSource: Record<string, string> | null;
  pass: PassState;
  passExpiresAt: string | null;
  passLifetime: boolean;
  trialPauseIds: string[];
  journalBackups: number;
  reminders: number;
  orders: Array<{ id: string; amount: number; status: string; paymentId: string | null; createdAt: string | null; paidAt: string | null }>;
  grants: Array<{ days: number; reason: string; by: string; until: string | null; createdAt: string | null }>;
  bugReports: Array<{ id: string; description: string; status: string; createdAt: string | null }>;
  changes: Array<{ by: string; fields: Record<string, { from: unknown; to: unknown }>; createdAt: string | null }>;
}

const FIELD_LABEL: Record<string, string> = {
  fullName: "Name",
  phone: "Phone",
  email: "Email",
  passExpiresAt: "Pass end date",
  passLifetime: "Pass for life",
  trialPauseIds: "Trial",
  password: "Password",
  signedOut: "Signed out everywhere",
};

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const stamp = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");

/** The yyyy-mm-dd an <input type="date"> wants, in India time. */
function dateInputValue(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function shown(value: unknown) {
  if (value === null || value === undefined || value === "") return "none";
  if (Array.isArray(value)) return `${value.length} used`;
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return day(value);
  return String(value);
}

function standing(account: Account) {
  const pass = account.pass;
  if (pass.lifetime) return "Pass for life";
  if (pass.expiresAt) return `${pass.status === "active" ? "Pass until" : "Pass ended"} ${formatPassDate(new Date(pass.expiresAt))}`;
  return `No Pass · trial ${pass.trial.used} of ${pass.trial.limit} used`;
}

export function AdminUserAccount({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [missing, setMissing] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [passEnd, setPassEnd] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const take = useCallback((next: Account) => {
    setAccount(next);
    setFullName(next.fullName);
    setPhone(next.phone);
    setEmail(next.email);
    setPassEnd(dateInputValue(next.passExpiresAt));
  }, []);

  useEffect(() => {
    apiFetch(`/api/admin/users/${userId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        take(((await response.json()) as { user: Account }).user);
      })
      .catch(() => setMissing(true));
  }, [userId, take]);

  const change = async (body: Record<string, unknown>, done: string) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as { user?: Account; changed?: string[]; error?: string };
      if (!response.ok || !result.user) {
        setNotice({ text: result.error ?? "That didn't save. Try again.", ok: false });
        return;
      }
      take(result.user);
      setNotice({ text: result.changed?.length ? done : "Nothing was different, so nothing changed.", ok: true });
    } catch {
      setNotice({ text: "That didn't save. Try again.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  const back = (
    <button type="button" onClick={onBack} className="ds-tap min-h-11 rounded-full px-1 text-[0.9rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
      ‹ All users
    </button>
  );

  if (missing) {
    return (
      <section className="space-y-3" aria-label="Account">
        {back}
        <p className="py-6 text-center text-[0.9rem]" style={{ color: "var(--ds-text-muted)" }}>
          This account couldn&rsquo;t be opened. It may have been deleted.
        </p>
      </section>
    );
  }
  if (!account) {
    return (
      <section className="space-y-3" aria-label="Account">
        {back}
        <p className="py-6 text-center text-[0.9rem]" style={{ color: "var(--ds-text-muted)" }}>
          Loading
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label={`Account of ${account.fullName || account.email}`}>
      {back}
      <header>
        <h2 className="ds-h2">{account.fullName || account.email}</h2>
        <p className="text-[0.88rem]" style={{ color: "var(--ds-text-secondary)" }}>
          {account.email} · {standing(account)}
        </p>
        <p className="text-[0.8rem]" style={{ color: "var(--ds-text-muted)" }}>
          Joined {stamp(account.createdAt)}
          {account.signupSource ? ` · from ${Object.entries(account.signupSource).map(([key, value]) => `${key.replace(/^utm_/, "")} ${value}`).join(", ")}` : ""}
        </p>
      </header>

      {notice ? (
        <p
          role="status"
          className="rounded-[var(--ds-radius-md)] px-4 py-3 text-[0.88rem]"
          style={{ background: notice.ok ? "var(--ds-accent-soft)" : "var(--ds-surface)", color: notice.ok ? undefined : "var(--ds-error)" }}
        >
          {notice.text}
        </p>
      ) : null}

      <Card title="Details">
        <Field label="Name" id="admin-name">
          <input id="admin-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="ds-field w-full" maxLength={80} />
        </Field>
        <Field label="Phone" id="admin-phone">
          <input id="admin-phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="ds-field w-full" inputMode="tel" maxLength={30} />
        </Field>
        <Field label="Email (they sign in with this)" id="admin-email">
          <input id="admin-email" value={email} onChange={(event) => setEmail(event.target.value)} className="ds-field w-full" type="email" maxLength={254} />
        </Field>
        <Action disabled={busy} onClick={() => void change({ fullName, phone, email }, "Details saved.")}>
          Save details
        </Action>
      </Card>

      <Card title="Pass">
        <p className="text-[0.88rem]">{standing(account)}</p>
        <Field label="Pass ends on" id="admin-pass-end">
          <input id="admin-pass-end" type="date" value={passEnd} onChange={(event) => setPassEnd(event.target.value)} className="ds-field w-full" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Action disabled={busy || !passEnd} onClick={() => void change({ passExpiresAt: `${passEnd}T23:59:59+05:30` }, `The Pass now ends on ${day(`${passEnd}T12:00:00+05:30`)}.`)}>
            Set end date
          </Action>
          <Action quiet disabled={busy || !account.passExpiresAt} onClick={() => void change({ passExpiresAt: null }, "The Pass end date is removed.")}>
            Remove Pass
          </Action>
          <Action quiet disabled={busy} onClick={() => void change({ passLifetime: !account.passLifetime }, account.passLifetime ? "Pass for life is off." : "Pass for life is on.")}>
            {account.passLifetime ? "Turn off Pass for life" : "Make it a Pass for life"}
          </Action>
        </div>
      </Card>

      <Card title="Trial">
        <p className="text-[0.88rem]">
          {account.pass.trial.used} of {account.pass.trial.limit} trial Pauses used
        </p>
        <Action quiet disabled={busy || account.trialPauseIds.length === 0} onClick={() => void change({ resetTrial: true }, "The trial starts again: 2 Pauses.")}>
          Start the trial again
        </Action>
      </Card>

      <Card title="Sign in">
        <Field label="New password (at least 6 characters)" id="admin-password">
          <input id="admin-password" type="text" autoComplete="off" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="ds-field w-full" />
        </Field>
        <p className="text-[0.8rem]" style={{ color: "var(--ds-text-muted)" }}>
          A new password signs them out on every device. Tell them the new one yourself.
        </p>
        <div className="flex flex-wrap gap-2">
          <Action
            disabled={busy || newPassword.length < 6}
            onClick={() => {
              void change({ newPassword }, "Password changed. They're signed out everywhere.").then(() => setNewPassword(""));
            }}
          >
            Set password
          </Action>
          <Action quiet disabled={busy} onClick={() => void change({ signOut: true }, "Signed out on every device.")}>
            Sign out everywhere
          </Action>
        </div>
      </Card>

      <Card title="On the server">
        <Line label="Journal backup" value={account.journalBackups ? `${account.journalBackups} entries, encrypted` : "Off"} />
        <Line label="Practice reminders" value={account.reminders ? String(account.reminders) : "None"} />
      </Card>

      <Card title="Payments">
        {account.orders.length === 0 ? (
          <Empty>No payments.</Empty>
        ) : (
          account.orders.map((order) => (
            <Line key={order.id} label={stamp(order.createdAt)} value={`${rupees(order.amount / 100)} · ${order.status === "paid" ? `paid ${order.paymentId ?? ""}` : "not paid"}`} />
          ))
        )}
      </Card>

      <Card title="Time given">
        {account.grants.length === 0 ? (
          <Empty>None.</Empty>
        ) : (
          account.grants.map((grant, index) => <Line key={index} label={stamp(grant.createdAt)} value={`${grant.days} days · ${grant.reason} · by ${grant.by}`} />)
        )}
      </Card>

      <Card title="Bug reports">
        {account.bugReports.length === 0 ? (
          <Empty>None.</Empty>
        ) : (
          account.bugReports.map((report) => <Line key={report.id} label={`${stamp(report.createdAt)} · ${report.status}`} value={report.description} />)
        )}
      </Card>

      <Card title="Changes made here">
        {account.changes.length === 0 ? (
          <Empty>None yet.</Empty>
        ) : (
          account.changes.map((entry, index) => (
            <Line
              key={index}
              label={`${stamp(entry.createdAt)} · ${entry.by}`}
              value={Object.entries(entry.fields)
                .map(([field, { from, to }]) => (field === "password" || field === "signedOut" ? FIELD_LABEL[field] : `${FIELD_LABEL[field] ?? field}: ${shown(from)} → ${shown(to)}`))
                .join("; ")}
            />
          ))
        )}
      </Card>
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ds-card space-y-3 px-4 py-4" aria-label={title}>
      <h3 className="ds-h3">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[0.82rem] font-medium" style={{ color: "var(--ds-text-secondary)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Action({ children, onClick, disabled, quiet = false }: { children: ReactNode; onClick: () => void; disabled?: boolean; quiet?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`ds-tap min-h-11 rounded-full px-4 text-[0.88rem] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${quiet ? "border" : "ds-filled"}`}
      style={quiet ? { borderColor: "var(--ds-border)", color: "var(--ds-accent)" } : undefined}
    >
      {children}
    </button>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t pt-2 text-[0.85rem] first:border-t-0 first:pt-0" style={{ borderColor: "var(--ds-border)" }}>
      <p style={{ color: "var(--ds-text-muted)" }}>{label}</p>
      <p className="break-words">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.85rem]" style={{ color: "var(--ds-text-muted)" }}>
      {children}
    </p>
  );
}
