"use client";

import { useEffect, useMemo, useState } from "react";

import { AppPageHeader } from "@/components/chakra-path-ui";
import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { ApiClientError, type AdminAlert, type AdminOverview, type AdminSection, type AdminStatus } from "@/lib/api/client";
import { createFrontendApiClient } from "@/lib/auth/session";

const sections: Array<{ key: AdminSection; label: string; copy: string }> = [
  { key: "costs", label: "AWS costs", copy: "Budget, month-to-date cost and forecast status." },
  { key: "database", label: "Database health", copy: "RDS status, storage and backup signals." },
  { key: "api-usage", label: "API usage", copy: "Requests, failures, throttles and rate-limit status." },
  { key: "file-upload-security", label: "File security", copy: "Upload rejection and S3 public-access status." },
  { key: "security", label: "Security status", copy: "Secrets scan, access findings and recommendations." },
  { key: "suspicious-logins", label: "Login activity", copy: "Risky login and Cognito Threat Protection state." },
  { key: "privacy-tests", label: "Privacy tests", copy: "Cross-user isolation and token rejection results." },
  { key: "backups", label: "Backups", copy: "Automatic backup, snapshot and restore-test status." },
];

export function AdminControlRoomScreen() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [selectedSection, setSelectedSection] = useState<AdminSection>("costs");
  const [sectionData, setSectionData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ service: "", severity: "", state: "" });

  const api = useMemo(() => createFrontendApiClient(), []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [nextOverview, nextAlerts] = await Promise.all([api.getAdminOverview(), api.getAdminAlerts()]);
        if (!active) return;
        setOverview(nextOverview);
        setAlerts(nextAlerts.alerts);
      } catch (caught) {
        if (!active) return;
        setError(adminErrorMessage(caught));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    let active = true;
    async function loadSection() {
      setSectionLoading(true);
      try {
        const data = await api.getAdminSection(selectedSection);
        if (active) setSectionData(data);
      } catch (caught) {
        if (active) setSectionData({ status: "Unknown", error: adminErrorMessage(caught) });
      } finally {
        if (active) setSectionLoading(false);
      }
    }
    void loadSection();
    return () => {
      active = false;
    };
  }, [api, selectedSection]);

  const filteredAlerts = alerts.filter((alert) =>
    (!filters.service || alert.service === filters.service) &&
    (!filters.severity || alert.severity === filters.severity) &&
    (!filters.state || alert.state === filters.state),
  );

  const runCompleteTest = async () => {
    setRunningTest(true);
    setError("");
    try {
      const result = await api.runAdminCompleteTest();
      setOverview((current) => (current ? { ...current, latestTestRun: result } : current));
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setRunningTest(false);
    }
  };

  return (
    <MvpShell>
      <div className="space-y-4">
        <AppPageHeader title="Admin Control Room" copy="Read-only AWS test environment status for The Inner Pause." backHref="/profile" />

        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--ip-purple)]">Secure admin area</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">
            Backend access is verified with Cognito admin group membership. Normal user tokens are rejected by the API.
          </p>
        </GlassCard>

        {loading ? <GlassCard className="p-4 text-sm text-[var(--ip-body)]">Loading admin status…</GlassCard> : null}
        {error ? <GlassCard className="border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</GlassCard> : null}

        {overview ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2">
              {overview.cards.map((card) => (
                <GlassCard key={card.key} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ip-muted)]">{card.label}</p>
                      <p className="mt-2 font-serif text-2xl text-[var(--ip-ink)]">{card.value}</p>
                    </div>
                    <StatusPill status={card.status} />
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[var(--ip-body)]">{card.detail}</p>
                </GlassCard>
              ))}
            </section>

            <GlassCard className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-[var(--ip-ink)]">Run Complete App Test</h2>
                  <p className="text-sm text-[var(--ip-body)]">{overview.latestTestRun.message}</p>
                </div>
                <GoldButton disabled={runningTest} onClick={runCompleteTest}>
                  {runningTest ? "Starting…" : "Run Complete Test"}
                </GoldButton>
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <AdminFact label="Status" value={overview.latestTestRun.status} />
                <AdminFact label="Passed tests" value={overview.latestTestRun.passedTests} />
                <AdminFact label="Failed tests" value={overview.latestTestRun.failedTests} />
                <AdminFact label="Failing step" value={overview.latestTestRun.exactFailingStep ?? "None recorded"} />
                <AdminFact label="Started" value={overview.latestTestRun.startedAt ?? "Not started"} />
                <AdminFact label="Completed" value={overview.latestTestRun.completedAt ?? "Not completed"} />
              </dl>
            </GlassCard>
          </>
        ) : null}

        <GlassCard className="p-4">
          <h2 className="font-serif text-2xl text-[var(--ip-ink)]">CloudWatch alerts</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select value={filters.service} onChange={(event) => setFilters((current) => ({ ...current, service: event.target.value }))} className="soft-input rounded-2xl p-3 text-sm">
              <option value="">All services</option>
              <option>Lambda</option>
              <option>API Gateway</option>
              <option>RDS</option>
              <option>SQS</option>
            </select>
            <select value={filters.severity} onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))} className="soft-input rounded-2xl p-3 text-sm">
              <option value="">All severity</option>
              <option>Info</option>
              <option>Warning</option>
              <option>Critical</option>
            </select>
            <select value={filters.state} onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value }))} className="soft-input rounded-2xl p-3 text-sm">
              <option value="">All states</option>
              <option>Active</option>
              <option>Resolved</option>
              <option>Unknown</option>
            </select>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--ip-muted)]">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Severity</th>
                  <th className="p-2">State</th>
                  <th className="p-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.length ? (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="border-t border-[var(--ip-border)]">
                      <td className="p-2">{new Date(alert.occurredAt).toLocaleString()}</td>
                      <td className="p-2">{alert.service}</td>
                      <td className="p-2">{alert.severity}</td>
                      <td className="p-2">{alert.state}</td>
                      <td className="p-2">{alert.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-[var(--ip-body)]">No alerts match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <section className="grid gap-3 sm:grid-cols-[16rem_1fr]">
          <GlassCard className="p-3">
            <div className="grid gap-2">
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setSelectedSection(section.key)}
                  className={`rounded-2xl border p-3 text-left text-sm ${selectedSection === section.key ? "border-[var(--ip-purple)] bg-[var(--ip-lavender)] text-[var(--ip-purple)]" : "border-[var(--ip-border)] bg-white/70 text-[var(--ip-body)]"}`}
                >
                  <span className="font-semibold">{section.label}</span>
                  <span className="mt-1 block text-xs">{section.copy}</span>
                </button>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <h2 className="font-serif text-2xl text-[var(--ip-ink)]">{sections.find((item) => item.key === selectedSection)?.label}</h2>
            {sectionLoading ? <p className="mt-3 text-sm text-[var(--ip-body)]">Loading section…</p> : <JsonDetails data={sectionData ?? { status: "Unknown" }} />}
          </GlassCard>
        </section>
      </div>
    </MvpShell>
  );
}

function StatusPill({ status }: { status: AdminStatus }) {
  const className =
    status === "Healthy"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "Critical"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-600";
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function AdminFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--ip-border)] bg-white/68 p-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-[var(--ip-muted)]">{label}</dt>
      <dd className="mt-1 break-words text-[var(--ip-ink)]">{String(value)}</dd>
    </div>
  );
}

function JsonDetails({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="mt-3 max-h-[28rem] overflow-auto rounded-2xl border border-[var(--ip-border)] bg-white/72 p-3 text-xs leading-5 text-[var(--ip-body)]">
      {JSON.stringify(redact(data), null, 2)}
    </pre>
  );
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      /secret|token|password|key|credential/i.test(key) ? "[redacted]" : redact(item),
    ]),
  );
}

function adminErrorMessage(caught: unknown) {
  if (caught instanceof ApiClientError && caught.status === 403) return "Admin access is required. Ask Sahil to add your Cognito user to the InnerPauseAdmins group.";
  if (caught instanceof ApiClientError && caught.status === 401) return "Please sign in before opening the Admin Control Room.";
  return caught instanceof Error ? caught.message : "The admin dashboard could not load.";
}
