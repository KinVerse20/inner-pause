"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { GoldButton } from "@/components/mvp-shell";
import { ApiClientError, type AdminAlert, type AdminOverview, type AdminSection, type AdminStatus } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { createFrontendApiClient } from "@/lib/auth/session";

const sections: Array<{ key: AdminSection; label: string; copy: string }> = [
  { key: "costs", label: "AWS cost", copy: "Budget, spend and service cost." },
  { key: "database", label: "Database", copy: "RDS status, storage and backups." },
  { key: "api-usage", label: "API usage", copy: "Requests, failures and response time." },
  { key: "file-upload-security", label: "File security", copy: "S3 public access and upload safety." },
  { key: "security", label: "Security", copy: "Secrets, access and admin setup." },
  { key: "suspicious-logins", label: "Login activity", copy: "Users, suspicious logins and Cognito settings." },
  { key: "privacy-tests", label: "Privacy tests", copy: "User isolation and token checks." },
  { key: "backups", label: "Backups", copy: "Automatic backup and restore readiness." },
];

export function AdminControlRoomScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [selectedSection, setSelectedSection] = useState<AdminSection>("costs");
  const [sectionData, setSectionData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [filters, setFilters] = useState({ service: "", severity: "", state: "" });

  const loadOverview = useCallback(async () => {
    const api = createFrontendApiClient();
    setLoading(true);
    setError("");
    try {
      const [nextOverview, nextAlerts] = await Promise.all([api.getAdminOverview(), api.getAdminAlerts()]);
      setOverview(nextOverview);
      setAlerts(nextAlerts.alerts);
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSection = useCallback(async (section = selectedSection) => {
    const api = createFrontendApiClient();
    setSectionLoading(true);
    setSectionError("");
    try {
      setSectionData(await api.getAdminSection(section));
    } catch (caught) {
      setSectionData(null);
      setSectionError(adminErrorMessage(caught));
    } finally {
      setSectionLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    queueMicrotask(() => void loadOverview());
  }, [loadOverview]);

  useEffect(() => {
    queueMicrotask(() => void loadSection(selectedSection));
  }, [loadSection, selectedSection]);

  const filteredAlerts = alerts.filter((alert) =>
    (!filters.service || alert.service === filters.service) &&
    (!filters.severity || alert.severity === filters.severity) &&
    (!filters.state || alert.state === filters.state),
  );
  const activeAlerts = alerts.filter((alert) => alert.state === "Active");
  const resolvedAlerts = alerts.filter((alert) => alert.state === "Resolved");
  const unknownAlerts = alerts.filter((alert) => alert.state === "Unknown");

  const signOut = () => {
    auth.signOut();
    router.replace("/auth");
  };

  return (
    <div className="mvp-bg min-h-dvh overflow-x-hidden text-[var(--ip-ink)]">
      <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[1.5rem] border border-[var(--ip-border)] bg-white/86 p-4 shadow-[0_16px_44px_rgba(108,62,244,0.1)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ip-purple)]">Secure admin area</p>
              <h1 className="mt-1 font-serif text-3xl text-[var(--ip-ink)] sm:text-4xl">Admin Control Room</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ip-body)]">
                Read-only AWS test environment status. Admin API access is restricted to Cognito group <span className="font-semibold">InnerPauseAdmins</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="rounded-full border border-[var(--ip-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ip-purple)]">
                Back to app
              </Link>
              <button type="button" onClick={signOut} className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                Logout
              </button>
            </div>
          </div>
        </header>

        {loading ? <Notice tone="neutral" title="Loading admin status" copy="Checking AWS dashboard data…" /> : null}
        {error ? <Notice tone="danger" title="Admin dashboard could not load" copy={error} action={<button type="button" onClick={loadOverview} className="underline">Retry</button>} /> : null}

        {overview ? (
          <>
            <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {overview.cards.map((card) => (
                <SummaryCard key={card.key} label={card.label} value={formatMaybeDate(card.value)} status={card.status} detail={card.detail} />
              ))}
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_22rem]">
              <Panel title="Alerts" copy="Counts are separated so resolved alerts do not inflate active alert totals.">
                <div className="grid gap-2 sm:grid-cols-3">
                  <MiniMetric label="Active" value={activeAlerts.length} status={activeAlerts.length ? "Critical" : "Healthy"} />
                  <MiniMetric label="Resolved" value={resolvedAlerts.length} status="Healthy" />
                  <MiniMetric label="Unknown" value={unknownAlerts.length} status={unknownAlerts.length ? "Warning" : "Healthy"} />
                </div>
                <AlertFilters filters={filters} setFilters={setFilters} />
                <AlertsTable alerts={filteredAlerts} />
              </Panel>

              <Panel title="Full app test" copy="Remote runner status for end-to-end checks.">
                <div className="space-y-3">
                  <StatusLine label="Status" value={humanStatus(overview.latestTestRun.status)} status={overview.latestTestRun.status === "completed" ? "Healthy" : overview.latestTestRun.status === "failed" ? "Critical" : "Not configured"} />
                  <FactGrid
                    facts={[
                      ["Last run", formatDate(overview.latestTestRun.completedAt ?? overview.latestTestRun.startedAt)],
                      ["Passed tests", overview.latestTestRun.passedTests],
                      ["Failed tests", overview.latestTestRun.failedTests],
                      ["Failing step", overview.latestTestRun.exactFailingStep ?? "None recorded"],
                    ]}
                  />
                  {overview.latestTestRun.reportUrl ? <SafeLink href={overview.latestTestRun.reportUrl} label="Open report" /> : <p className="text-sm text-[var(--ip-muted)]">Report link not available.</p>}
                  <Notice tone="warning" title="Test runner not configured yet" copy={overview.latestTestRun.message} />
                  <GoldButton disabled className="w-full">
                    Test runner not configured yet
                  </GoldButton>
                </div>
              </Panel>
            </section>
          </>
        ) : null}

        <section className="mt-4 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <nav className="rounded-[1.5rem] border border-[var(--ip-border)] bg-white/84 p-3 shadow-[0_16px_38px_rgba(108,62,244,0.08)] backdrop-blur-xl">
            <p className="px-2 pb-2 text-xs uppercase tracking-[0.16em] text-[var(--ip-muted)]">Admin sections</p>
            <div className="grid gap-2">
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setSelectedSection(section.key)}
                  className={`rounded-2xl border p-3 text-left text-sm transition ${
                    selectedSection === section.key
                      ? "border-[var(--ip-purple)] bg-[var(--ip-lavender)] text-[var(--ip-purple)]"
                      : "border-[var(--ip-border)] bg-white/72 text-[var(--ip-body)] hover:border-[var(--ip-border-strong)]"
                  }`}
                >
                  <span className="font-semibold">{section.label}</span>
                  <span className="mt-1 block text-xs">{section.copy}</span>
                </button>
              ))}
            </div>
          </nav>

          <Panel
            title={sections.find((item) => item.key === selectedSection)?.label ?? "Section"}
            copy={sections.find((item) => item.key === selectedSection)?.copy}
            action={<button type="button" onClick={() => loadSection()} className="rounded-full border border-[var(--ip-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ip-purple)]">Retry</button>}
          >
            {sectionLoading ? <p className="text-sm text-[var(--ip-body)]">Loading section…</p> : null}
            {sectionError ? <Notice tone="danger" title="Section could not load" copy={sectionError} /> : null}
            {!sectionLoading && !sectionError ? <SectionRenderer section={selectedSection} data={sectionData ?? {}} /> : null}
          </Panel>
        </section>
      </main>
    </div>
  );
}

function SectionRenderer({ section, data }: { section: AdminSection; data: Record<string, unknown> }) {
  switch (section) {
    case "costs":
      return <CostSection data={data} />;
    case "database":
      return <DatabaseSection data={data} />;
    case "api-usage":
      return <ApiUsageSection data={data} />;
    case "file-upload-security":
      return <FileSecuritySection data={data} />;
    case "security":
      return <SecuritySection data={data} />;
    case "suspicious-logins":
      return <LoginActivitySection data={data} />;
    case "privacy-tests":
      return <PrivacyTestsSection data={data} />;
    case "backups":
      return <BackupSection data={data} />;
    default:
      return <EmptyState />;
  }
}

function CostSection({ data }: { data: Record<string, unknown> }) {
  const services = arrayOfRecords(data.services);
  return (
    <div className="space-y-4">
      <BusinessSummary
        status={statusValue(data.status)}
        meaning="Shows whether AWS spend is inside the expected monthly test budget."
        matters="Unexpected cost growth can happen quickly if paid AWS services are left running."
        action={text(data.recommendedAction) || (statusValue(data.status) === "Healthy" ? "" : "Review service spend and budget alerts.")}
      />
      <FactGrid facts={[
        ["Monthly budget", text(data.monthlyBudget)],
        ["Month-to-date spend", text(data.monthToDateCost)],
        ["Percentage used", text(data.percentageUsed)],
        ["Forecast", text(data.forecastedMonthlyCost)],
      ]} />
      <SimpleTable
        columns={["Service", "Cost"]}
        rows={services.map((item) => [text(item.service), money(item.cost, text(item.unit) || "USD")])}
        empty="Cost by service is not available yet."
      />
      <p className="text-sm text-[var(--ip-muted)]">{text(data.note) || "AWS cost data can lag."}</p>
    </div>
  );
}

function DatabaseSection({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <BusinessSummary status={statusValue(data.status)} meaning="Shows whether the private RDS database is reachable and in an expected state." matters="The app needs this database for accounts, journals and healing plans." action={statusValue(data.status) === "Healthy" ? "" : "Check RDS status and Lambda database permissions."} />
      <FactGrid facts={[
        ["Current status", text(data.runningStatus)],
        ["Storage", text(data.storageRemaining)],
        ["CPU usage", text(data.cpuUsage)],
        ["Connections", text(data.connectionCount)],
        ["Backups enabled", yesNo(data.backupEnabled)],
        ["Retention", text(data.backupRetentionPeriod)],
        ["Latest backup", formatDate(text(data.latestBackup))],
        ["Latest manual snapshot", formatDate(text(data.latestSnapshot))],
      ]} />
      <p className="text-sm text-[var(--ip-body)]">{text(data.warningStatus)}</p>
    </div>
  );
}

function ApiUsageSection({ data }: { data: Record<string, unknown> }) {
  const windows = arrayOfRecords(data.windows);
  return (
    <div className="space-y-4">
      <BusinessSummary status={statusValue(data.status)} meaning="Shows traffic and error levels for the backend API." matters="It helps identify failed requests, slow responses and API issues." action={statusValue(data.status) === "Healthy" ? "" : text(data.missingTelemetry) || "Connect API Gateway CloudWatch metrics."} />
      <FactGrid facts={[
        ["Total requests", text(data.totalRequests)],
        ["Successful requests", text(data.successfulRequests)],
        ["Failed requests", text(data.failedRequests)],
        ["Error rate", text(data.errorRate)],
        ["Throttled requests", text(data.throttledRequests)],
        ["Average response time", text(data.averageResponseTime)],
        ["Analysis requests", text(data.aiAnalysisRequestCount)],
      ]} />
      <SimpleTable
        columns={["Window", "Requests", "Success", "Failed", "Error rate", "Avg response"]}
        rows={windows.map((item) => [text(item.label), text(item.totalRequests), text(item.successfulRequests), text(item.failedRequests), text(item.errorRate), text(item.averageResponseTime)])}
        empty="CloudWatch API usage metrics are not connected yet."
      />
    </div>
  );
}

function FileSecuritySection({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <BusinessSummary status={statusValue(data.status)} meaning="Shows whether the audio S3 bucket blocks public access." matters="Uploaded or generated files must not become publicly readable by mistake." action={statusValue(data.status) === "Healthy" ? "" : "Review S3 Block Public Access and bucket policy settings."} />
      <Checklist items={[
        ["S3 public access", text(data.publicAccessStatus) === "Blocked" ? "Verified" : "Not tested", text(data.publicAccessStatus)],
        ["Oversized upload rejection", "Verified", text(data.rejectedBySize)],
        ["Unsupported file type rejection", "Verified", text(data.rejectedByType)],
        ["Failed upload tracking", text(data.failedUploads) === "Not connected yet" ? "Not tested" : "Verified", text(data.failedUploads)],
      ]} />
      <FactGrid facts={[["Storage sample", text(data.totalStorageUsed)], ["Rejected uploads", text(data.rejectedUploads)]]} />
    </div>
  );
}

function SecuritySection({ data }: { data: Record<string, unknown> }) {
  const findings = arrayOfRecords(data.iamAccessAnalyzerFindings);
  return (
    <div className="space-y-4">
      <BusinessSummary status={statusValue(data.status)} meaning="Shows whether key AWS security checks are available and clean." matters="Security checks reduce the chance of public data, exposed secrets or broad permissions." action={text(data.recommendedAction)} />
      <Checklist items={[
        ["S3 public access", "Verified", text(data.s3PublicAccess)],
        ["Secrets exposure", "Verified", text(data.secretsExposureStatus)],
        ["Admin access", "Verified", text(data.adminPermissionStatus)],
        ["Access Analyzer", statusValue(data.status) === "Not configured" ? "Not tested" : "Verified", text(data.accessAnalyzerSetup)],
      ]} />
      <FactGrid facts={[["Last security check", formatDate(text(data.latestSecurityScanDate))], ["Secret scan", text(data.codeScanningSecrets)], ["Broad IAM permissions", text(data.broadPermissions)]]} />
      <Details title="Technical details" summary="Access Analyzer finding IDs are truncated. No secrets are displayed.">
        <SimpleTable
          columns={["Resource type", "Status", "Public", "Finding ID"]}
          rows={findings.map((item) => [text(item.resourceType), text(item.status), yesNo(item.isPublic), truncate(text(item.id))])}
          empty="No Access Analyzer findings are available."
        />
      </Details>
    </div>
  );
}

function LoginActivitySection({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <BusinessSummary status={statusValue(data.status)} meaning="Shows account activity and risky login protection status." matters="Suspicious-login detection is limited unless Cognito Threat Protection is enabled." action={text(data.manualStep)} />
      <FactGrid facts={[
        ["Total users", text(data.totalUsers)],
        ["Recent login activity", text(data.recentLoginActivity)],
        ["Suspicious logins", text(data.suspiciousLoginCount)],
        ["Threat Protection", text(data.threatProtection)],
        ["Users sampled", text(data.usersSampled)],
      ]} />
      <Details title="How to enable" summary="AWS Cognito setting required for richer suspicious-login findings.">
        <p>Open Cognito in AWS, select the user pool, then enable Threat Protection / Advanced Security Features. Review AWS pricing before enabling it.</p>
      </Details>
    </div>
  );
}

function PrivacyTestsSection({ data }: { data: Record<string, unknown> }) {
  const tests = arrayOfRecords(data.tests);
  return (
    <div className="space-y-4">
      <BusinessSummary status={statusValue(data.status)} meaning="Shows whether users are isolated from each other’s private data." matters="A user must never access another user’s journal or healing history." action={statusValue(data.status) === "Healthy" ? "" : "Run backend privacy tests before deployment."} />
      <Checklist items={tests.map((item) => [text(item.name), checklistStatus(text(item.status)), text(item.detail)])} />
    </div>
  );
}

function BackupSection({ data }: { data: Record<string, unknown> }) {
  const recoveryPoints = arrayOfRecords(data.recoveryPoints);
  return (
    <div className="space-y-4">
      <BusinessSummary status={statusValue(data.status)} meaning="Shows whether the database has recoverable backups." matters="Backups protect the test environment from accidental data loss." action={text(data.restoreTestStatus) === "Not tested" ? "Schedule a restore test before relying on backups." : ""} />
      <FactGrid facts={[
        ["Automatic backups", yesNo(data.automaticBackupsEnabled)],
        ["Retention period", `${text(data.backupRetentionDays)} day(s)`],
        ["Latest backup", formatDate(text(data.latestBackup))],
        ["Latest manual snapshot", formatDate(text(data.latestManualSnapshot))],
        ["Restore test", text(data.restoreTestStatus)],
        ["Next restore-test date", formatDate(text(data.nextRecommendedRestoreTestDate))],
      ]} />
      <SimpleTable
        columns={["Recovery point", "Created"]}
        rows={recoveryPoints.map((point) => [text(point.status), formatDate(text(point.createdAt))])}
        empty="No AWS Backup recovery points are available yet."
      />
      <p className="text-sm text-[var(--ip-muted)]">{text(data.detail)}</p>
    </div>
  );
}

function SummaryCard({ label, value, status, detail }: { label: string; value: string; status: AdminStatus; detail: string }) {
  return (
    <section className="rounded-[1.25rem] border border-[var(--ip-border)] bg-white/86 p-4 shadow-[0_14px_34px_rgba(108,62,244,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ip-muted)]">{label}</p>
          <p className="mt-2 truncate font-serif text-2xl text-[var(--ip-ink)]" title={value}>{value}</p>
        </div>
        <StatusPill status={status} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--ip-body)]">{detail}</p>
    </section>
  );
}

function Panel({ title, copy, action, children }: { title: string; copy?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-[var(--ip-border)] bg-white/84 p-4 shadow-[0_16px_38px_rgba(108,62,244,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[var(--ip-ink)]">{title}</h2>
          {copy ? <p className="mt-1 text-sm text-[var(--ip-muted)]">{copy}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function BusinessSummary({ status, meaning, matters, action }: { status: AdminStatus; meaning: string; matters: string; action?: string }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <InfoBox label="Current status" value={<StatusPill status={status} />} />
      <InfoBox label="What it means" value={meaning} />
      <InfoBox label="Why it matters" value={matters} />
      {action ? <div className="lg:col-span-3"><Notice tone="warning" title="Recommended next step" copy={action} /></div> : null}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--ip-border)] bg-white/72 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ip-muted)]">{label}</p>
      <div className="mt-2 text-sm leading-5 text-[var(--ip-body)]">{value}</div>
    </div>
  );
}

function FactGrid({ facts }: { facts: Array<[string, unknown]> }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {facts.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-[var(--ip-border)] bg-white/72 p-3">
          <dt className="text-xs uppercase tracking-[0.14em] text-[var(--ip-muted)]">{label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-[var(--ip-ink)]">{text(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function MiniMetric({ label, value, status }: { label: string; value: number; status: AdminStatus }) {
  return (
    <div className="rounded-2xl border border-[var(--ip-border)] bg-white/74 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[var(--ip-muted)]">{label}</p>
        <StatusPill status={status} />
      </div>
      <p className="mt-2 font-serif text-3xl text-[var(--ip-ink)]">{value}</p>
    </div>
  );
}

function StatusLine({ label, value, status }: { label: string; value: string; status: AdminStatus }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ip-border)] bg-white/72 p-3">
      <span className="text-sm text-[var(--ip-muted)]">{label}</span>
      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ip-ink)]">{value}<StatusPill status={status} /></span>
    </div>
  );
}

function StatusPill({ status }: { status: AdminStatus | string }) {
  const normalized = status === "Unknown" ? "No data yet" : status;
  const className =
    normalized === "Healthy" || normalized === "Verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "Warning" || normalized === "Needs attention"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "Critical"
          ? "border-red-200 bg-red-50 text-red-700"
          : normalized === "Not configured"
            ? "border-purple-200 bg-purple-50 text-purple-700"
            : "border-slate-200 bg-slate-50 text-slate-600";
  return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{normalized}</span>;
}

function AlertFilters({ filters, setFilters }: { filters: { service: string; severity: string; state: string }; setFilters: React.Dispatch<React.SetStateAction<{ service: string; severity: string; state: string }>> }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      <Select label="Service" value={filters.service} onChange={(value) => setFilters((current) => ({ ...current, service: value }))} options={["", "Lambda", "API Gateway", "RDS", "SQS", "AWS"]} />
      <Select label="Severity" value={filters.severity} onChange={(value) => setFilters((current) => ({ ...current, severity: value }))} options={["", "Info", "Warning", "Critical"]} />
      <Select label="State" value={filters.state} onChange={(value) => setFilters((current) => ({ ...current, state: value }))} options={["", "Active", "Resolved", "Unknown"]} />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="soft-input w-full rounded-2xl p-3 text-sm">
        {options.map((option) => <option key={option} value={option}>{option || `All ${label.toLowerCase()}`}</option>)}
      </select>
    </label>
  );
}

function AlertsTable({ alerts }: { alerts: AdminAlert[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--ip-border)] bg-white/70">
      <table className="min-w-[44rem] w-full text-left text-sm">
        <thead className="bg-[var(--ip-lavender)] text-xs uppercase text-[var(--ip-muted)]">
          <tr>
            <th className="p-3">Last checked</th>
            <th className="p-3">Service</th>
            <th className="p-3">Severity</th>
            <th className="p-3">State</th>
            <th className="p-3">Plain-English reason</th>
          </tr>
        </thead>
        <tbody>
          {alerts.length ? alerts.map((alert) => (
            <tr key={alert.id} className="border-t border-[var(--ip-border)]">
              <td className="p-3">{formatDate(alert.occurredAt)}</td>
              <td className="p-3 font-semibold text-[var(--ip-ink)]">{alert.service}</td>
              <td className="p-3"><StatusPill status={alert.severity} /></td>
              <td className="p-3"><StatusPill status={alert.state === "Unknown" ? "No data yet" : alert.state} /></td>
              <td className="p-3 text-[var(--ip-body)]">{alert.reason}</td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="p-4 text-[var(--ip-body)]">No alerts match the current filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({ columns, rows, empty }: { columns: string[]; rows: string[][]; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--ip-border)] bg-white/70">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--ip-lavender)] text-xs uppercase text-[var(--ip-muted)]">
          <tr>{columns.map((column) => <th key={column} className="p-3">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="border-t border-[var(--ip-border)]">
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="p-3 text-[var(--ip-body)]">{cell}</td>)}
            </tr>
          )) : <tr><td colSpan={columns.length} className="p-4 text-[var(--ip-body)]">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Checklist({ items }: { items: Array<[string, string, string]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map(([label, status, detail]) => (
        <div key={label} className="rounded-2xl border border-[var(--ip-border)] bg-white/72 p-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-[var(--ip-ink)]">{label}</h3>
            <StatusPill status={status} />
          </div>
          {detail ? <p className="mt-2 text-sm leading-5 text-[var(--ip-body)]">{detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

function Notice({ tone, title, copy, action }: { tone: "neutral" | "warning" | "danger"; title: string; copy: string; action?: React.ReactNode }) {
  const className = tone === "danger" ? "border-red-200 bg-red-50 text-red-700" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[var(--ip-border)] bg-white/80 text-[var(--ip-body)]";
  return (
    <div className={`mt-4 rounded-2xl border p-3 text-sm ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold">{title}</p><p className="mt-1 leading-5">{copy}</p></div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

function Details({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return (
    <details className="rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
      <summary className="cursor-pointer font-semibold text-[var(--ip-ink)]">{title}<span className="ml-2 font-normal text-[var(--ip-muted)]">{summary}</span></summary>
      <div className="mt-3 text-sm leading-5 text-[var(--ip-body)]">{children}</div>
    </details>
  );
}

function SafeLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="block truncate rounded-full border border-[var(--ip-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ip-purple)]" title={href}>{label}: {truncate(href, 42)}</a>;
}

function EmptyState() {
  return <p className="rounded-2xl border border-[var(--ip-border)] bg-white/70 p-4 text-sm text-[var(--ip-body)]">No data yet.</p>;
}

function formatDate(value: unknown) {
  const raw = text(value);
  if (!raw || raw === "Unknown" || raw === "No data yet" || raw === "Not connected yet") return raw || "No data yet";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMaybeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}T/.test(value) ? formatDate(value) : value;
}

function text(value: unknown) {
  if (value === undefined || value === null || value === "") return "No data yet";
  if (typeof value === "number") return new Intl.NumberFormat("en-IN").format(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function statusValue(value: unknown): AdminStatus {
  const raw = text(value);
  if (["Healthy", "Warning", "Critical", "Unknown", "Not configured", "No data yet"].includes(raw)) return raw as AdminStatus;
  return "No data yet";
}

function yesNo(value: unknown) {
  return typeof value === "boolean" ? (value ? "Yes" : "No") : text(value);
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function money(value: unknown, unit: string) {
  if (typeof value !== "number") return text(value);
  return `${unit} ${value.toFixed(2)}`;
}

function truncate(value: string, length = 24) {
  return value.length > length ? `${value.slice(0, Math.max(0, length - 5))}…${value.slice(-4)}` : value;
}

function humanStatus(value: string) {
  return value === "blocked" ? "Not configured" : value.replace(/-/g, " ");
}

function checklistStatus(value: string) {
  if (/verified/i.test(value)) return "Verified";
  if (/not applicable/i.test(value)) return "Not applicable";
  return "Not tested";
}

function adminErrorMessage(caught: unknown) {
  if (caught instanceof ApiClientError && caught.status === 403) return "Admin access is required. Ask Sahil to add your Cognito user to the InnerPauseAdmins group.";
  if (caught instanceof ApiClientError && caught.status === 401) return "Please sign in before opening the Admin Control Room.";
  return caught instanceof Error ? caught.message : "The admin dashboard could not load.";
}
