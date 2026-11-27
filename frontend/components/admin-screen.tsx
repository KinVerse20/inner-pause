"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { PassState } from "@inner-pause/shared";

import { apiFetch, apiUrl } from "@/lib/api";
import { formatPassDate } from "@/lib/pass-summary";
import { AdminUserAccount } from "@/components/admin-user-account";

// /admin (docs/COMMERCIAL_PLAN.md C7): the founder's tools. Bug reports
// (mark Valid to give the user a month of Pass, once per report), and
// users: give time by hand, or open an account to see and change it. Only accounts in ADMIN_EMAILS;
// to anyone else the API answers "not found" and so does this page.

type BugStatus = "new" | "valid" | "not-a-bug" | "duplicate";

interface BugReport {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string;
  description: string;
  page: string;
  userAgent: string;
  hasScreenshot: boolean;
  status: BugStatus;
  createdAt: string;
  rewardedAt: string | null;
  rewardedUntil: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  pass: PassState;
}

const FILTERS: Array<{ id: BugStatus | "all"; label: string }> = [
  { id: "new", label: "New" },
  { id: "valid", label: "Valid" },
  { id: "not-a-bug", label: "Not a bug" },
  { id: "duplicate", label: "Duplicate" },
  { id: "all", label: "All" },
];

const STATUS_LABEL: Record<BugStatus, string> = { new: "New", valid: "Valid", "not-a-bug": "Not a bug", duplicate: "Duplicate" };

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function passLine(pass: PassState) {
  if (pass.lifetime) return "Pass for life";
  if (pass.expiresAt) return `${pass.status === "active" ? "Pass until" : "Pass ended"} ${formatPassDate(new Date(pass.expiresAt))}`;
  return `No Pass · trial ${pass.trial.used} of ${pass.trial.limit} used`;
}

export function AdminScreen() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"bugs" | "users">("bugs");

  useEffect(() => {
    apiFetch("/api/admin/me", { cache: "no-store" })
      .then((response) => setAllowed(response.ok))
      .catch(() => setAllowed(false));
  }, []);

  return (
    <div className="min-h-dvh" style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}>
      <main className="mx-auto w-full max-w-[44rem] space-y-5 px-4 pb-12 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        {allowed === null ? (
          <p className="pt-10 text-center text-[0.9rem]" style={{ color: "var(--ds-text-muted)" }}>
            Loading
          </p>
        ) : !allowed ? (
          <div className="grid justify-items-center gap-3 pt-24 text-center">
            <h1 className="ds-h2">Page not found</h1>
            <Link href="/" className="ds-tap min-h-11 rounded-full px-4 py-2.5 text-[0.9rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3">
              <h1 className="ds-h2">Admin</h1>
              <Link href="/profile" className="ds-tap min-h-11 rounded-full px-3 py-2.5 text-[0.85rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
                Back to the app
              </Link>
            </header>
            <div role="tablist" aria-label="Admin sections" className="flex gap-2">
              {(["bugs", "users"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`ds-tap min-h-11 rounded-full px-4 text-[0.9rem] font-semibold ${tab === id ? "ds-filled" : ""}`}
                  style={tab === id ? undefined : { background: "var(--ds-surface)", color: "var(--ds-text-secondary)" }}
                >
                  {id === "bugs" ? "Bug reports" : "Users"}
                </button>
              ))}
            </div>
            {tab === "bugs" ? <BugReports /> : <Users />}
          </>
        )}
      </main>
    </div>
  );
}

function BugReports() {
  const [filter, setFilter] = useState<BugStatus | "all">("new");
  const [reports, setReports] = useState<BugReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (which: BugStatus | "all") => {
    setError(null);
    try {
      const response = await apiFetch(`/api/admin/bugs${which === "all" ? "" : `?status=${which}`}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      setReports(((await response.json()) as { reports: BugReport[] }).reports);
    } catch {
      setError("Couldn't load the reports. Try again.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(filter);
  }, [filter, load]);

  const setStatus = async (report: BugReport, status: BugStatus) => {
    setBusyId(report.id);
    setNotice(null);
    try {
      const response = await apiFetch(`/api/admin/bugs/${report.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      const { report: updated, rewarded } = (await response.json()) as { report: BugReport; rewarded: boolean };
      if (rewarded && updated.rewardedUntil) {
        setNotice(`A month added for ${updated.userName || updated.userEmail}. Their Pass now runs until ${formatPassDate(new Date(updated.rewardedUntil))}.`);
      }
      setReports((current) => (current ?? []).map((item) => (item.id === updated.id ? updated : item)).filter((item) => filter === "all" || item.status === filter));
    } catch {
      setNotice("That didn't save. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4" aria-label="Bug reports">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className="ds-tap min-h-11 rounded-full border px-3.5 text-[0.85rem] font-medium"
            style={{ borderColor: filter === item.id ? "var(--ds-accent)" : "var(--ds-border)", color: filter === item.id ? "var(--ds-accent)" : "var(--ds-text-secondary)" }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {notice ? (
        <p role="status" className="rounded-[var(--ds-radius-md)] px-4 py-3 text-[0.88rem]" style={{ background: "var(--ds-accent-soft)" }}>
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={{ color: "var(--ds-error)" }}>
          {error}
        </p>
      ) : reports === null ? null : reports.length === 0 ? (
        <p className="py-6 text-center text-[0.9rem]" style={{ color: "var(--ds-text-muted)" }}>
          Nothing here.
        </p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="ds-card space-y-3 px-4 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[0.95rem] font-semibold">
                  {report.userName || "Deleted account"} <span className="font-normal" style={{ color: "var(--ds-text-muted)" }}>{report.userEmail}</span>
                </p>
                <p className="text-[0.8rem]" style={{ color: "var(--ds-text-muted)" }}>
                  {when(report.createdAt)} · {STATUS_LABEL[report.status]}
                </p>
              </div>
              <p className="whitespace-pre-wrap text-[0.92rem] leading-6">{report.description}</p>
              {report.hasScreenshot ? (
                <a href={apiUrl(`/api/admin/bugs/${report.id}/screenshot`)} target="_blank" rel="noreferrer" className="block w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={apiUrl(`/api/admin/bugs/${report.id}/screenshot`)} alt="Screenshot sent with the report" className="max-h-72 rounded-[var(--ds-radius-sm)] border" style={{ borderColor: "var(--ds-border)" }} />
                </a>
              ) : null}
              <p className="text-[0.75rem] leading-5" style={{ color: "var(--ds-text-muted)" }}>
                {report.page} · {report.userAgent}
              </p>
              {report.rewardedAt ? (
                <p className="text-[0.85rem] font-medium" style={{ color: "var(--ds-success)" }}>
                  Month given{report.rewardedUntil ? ` · Pass until ${formatPassDate(new Date(report.rewardedUntil))}` : ""}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {report.status !== "valid" && !report.rewardedAt && report.userId ? (
                  <button type="button" disabled={busyId === report.id} onClick={() => void setStatus(report, "valid")} className="ds-filled ds-tap min-h-11 px-4 text-[0.85rem] disabled:opacity-55">
                    Valid · give 1 month
                  </button>
                ) : null}
                {(["not-a-bug", "duplicate", "new"] as const)
                  .filter((status) => status !== report.status)
                  .map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busyId === report.id}
                      onClick={() => void setStatus(report, status)}
                      className="ds-tap min-h-11 rounded-full border px-4 text-[0.85rem] font-medium disabled:opacity-55"
                      style={{ borderColor: "var(--ds-border)" }}
                    >
                      {status === "new" ? "Back to New" : STATUS_LABEL[status]}
                    </button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Users() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async (text: string) => {
    const response = await apiFetch(`/api/admin/users?q=${encodeURIComponent(text.trim())}`, { cache: "no-store" }).catch(() => null);
    setUsers(response?.ok ? ((await response.json()) as { users: AdminUser[] }).users : []);
  }, []);

  // The newest accounts, before any search.
  useEffect(() => {
    let live = true;
    apiFetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as { users: AdminUser[] }).users : []))
      .catch(() => [])
      .then((found) => {
        if (live) setUsers(found);
      });
    return () => {
      live = false;
    };
  }, []);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    void load(query);
  };

  const extend = async (user: AdminUser) => {
    setBusyId(user.id);
    setNotice(null);
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30, reason: "Given by hand from /admin", notify: true }),
      });
      if (!response.ok) throw new Error();
      const { pass } = (await response.json()) as { pass: PassState };
      setUsers((current) => (current ?? []).map((item) => (item.id === user.id ? { ...item, pass } : item)));
      setNotice(`A month added for ${user.fullName || user.email}. ${passLine(pass)}.`);
    } catch {
      setNotice("That didn't save. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (openId) {
    return (
      <AdminUserAccount
        userId={openId}
        onBack={() => {
          setOpenId(null);
          void load(query);
        }}
      />
    );
  }

  return (
    <section className="space-y-4" aria-label="Users">
      <form onSubmit={search} className="flex gap-2">
        <label htmlFor="admin-user-search" className="sr-only">
          Email or name
        </label>
        <input id="admin-user-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Email, name or phone" className="ds-field min-w-0 flex-1" />
        <button type="submit" className="ds-filled ds-tap min-h-11 px-5 text-[0.9rem]">
          Find
        </button>
      </form>
      {notice ? (
        <p role="status" className="rounded-[var(--ds-radius-md)] px-4 py-3 text-[0.88rem]" style={{ background: "var(--ds-accent-soft)" }}>
          {notice}
        </p>
      ) : null}
      {users === null ? null : users.length === 0 ? (
        <p className="py-6 text-center text-[0.9rem]" style={{ color: "var(--ds-text-muted)" }}>
          No one found.
        </p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id} className="ds-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.fullName || user.email}</p>
                <p className="truncate text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                  {user.email} · {passLine(user.pass)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.pass.lifetime ? null : (
                  <button type="button" disabled={busyId === user.id} onClick={() => void extend(user)} className="ds-tap min-h-11 rounded-full border px-4 text-[0.85rem] font-semibold disabled:opacity-55" style={{ borderColor: "var(--ds-border)", color: "var(--ds-accent)" }}>
                    Give 1 month
                  </button>
                )}
                <button type="button" onClick={() => setOpenId(user.id)} className="ds-filled ds-tap min-h-11 px-4 text-[0.85rem]">
                  Open account
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
