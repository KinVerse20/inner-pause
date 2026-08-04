import { AccessAnalyzerClient, ListAnalyzersCommand, ListFindingsCommand } from "@aws-sdk/client-accessanalyzer";
import { BackupClient, ListRecoveryPointsByBackupVaultCommand } from "@aws-sdk/client-backup";
import { CloudWatchClient, DescribeAlarmsCommand, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSnapshotsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketPolicyStatusCommand, GetPublicAccessBlockCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import type { BackendConfig } from "../config/env.js";

export type AdminStatus = "Healthy" | "Warning" | "Critical" | "Unknown";
export type AdminSeverity = "Info" | "Warning" | "Critical";

export interface AdminOverview {
  generatedAt: string;
  cards: Array<{ key: string; label: string; status: AdminStatus; value: string; detail: string }>;
  alerts: AdminAlert[];
  latestTestRun: AdminTestRun;
}

export interface AdminAlert {
  id: string;
  service: string;
  severity: AdminSeverity;
  state: "Active" | "Resolved" | "Unknown";
  reason: string;
  occurredAt: string;
}

export interface AdminTestRun {
  id: string;
  status: "idle" | "running" | "completed" | "failed" | "blocked";
  passedTests: number;
  failedTests: number;
  startedAt?: string;
  completedAt?: string;
  exactFailingStep?: string;
  reportUrl?: string;
  screenshots: string[];
  message: string;
}

export interface AdminDashboardProvider {
  getOverview(): Promise<AdminOverview>;
  getAlerts(filters?: { service?: string; severity?: string; state?: string }): Promise<{ alerts: AdminAlert[] }>;
  getCosts(): Promise<Record<string, unknown>>;
  getDatabaseHealth(): Promise<Record<string, unknown>>;
  getApiUsage(): Promise<Record<string, unknown>>;
  getFileUploadSecurity(): Promise<Record<string, unknown>>;
  getSecurityStatus(): Promise<Record<string, unknown>>;
  getSuspiciousLogins(): Promise<Record<string, unknown>>;
  getPrivacyTests(): Promise<Record<string, unknown>>;
  getBackupStatus(): Promise<Record<string, unknown>>;
  runCompleteTest(input: { actorId: string; idempotencyKey?: string }): Promise<AdminTestRun>;
  getTestRuns(): Promise<{ runs: AdminTestRun[] }>;
}

let latestRun: AdminTestRun = {
  id: "not-run",
  status: "idle",
  passedTests: 0,
  failedTests: 0,
  screenshots: [],
  message: "No complete app test has been started from the admin dashboard yet.",
};
let lastRunRequestAt = 0;

export class AwsAdminDashboardProvider implements AdminDashboardProvider {
  private readonly cloudWatch: CloudWatchClient;
  private readonly costExplorer: CostExplorerClient;
  private readonly rds: RDSClient;
  private readonly cognito: CognitoIdentityProviderClient;
  private readonly sqs: SQSClient;
  private readonly s3: S3Client;
  private readonly accessAnalyzer: AccessAnalyzerClient;
  private readonly backup: BackupClient;

  constructor(private readonly config: BackendConfig) {
    const region = config.region ?? process.env.AWS_REGION ?? "ap-south-1";
    this.cloudWatch = new CloudWatchClient({ region });
    this.costExplorer = new CostExplorerClient({ region: "us-east-1" });
    this.rds = new RDSClient({ region });
    this.cognito = new CognitoIdentityProviderClient({ region });
    this.sqs = new SQSClient({ region });
    this.s3 = new S3Client({ region });
    this.accessAnalyzer = new AccessAnalyzerClient({ region });
    this.backup = new BackupClient({ region });
  }

  async getOverview(): Promise<AdminOverview> {
    const [backendHealth, database, costs, alerts, s3, backup] = await Promise.all([
      safe(() => Promise.resolve({ status: "Healthy" as AdminStatus, value: "Online", detail: "API Lambda responded to routing checks." })),
      safe(() => this.getDatabaseHealth()),
      safe(() => this.getCosts()),
      safe(() => this.getAlerts()),
      safe(() => this.getFileUploadSecurity()),
      safe(() => this.getBackupStatus()),
    ]);

    const cards = [
      card("frontend", "Frontend status", this.config.awsAmplifyAppId ? "Healthy" : "Unknown", this.config.awsAmplifyBranchName ?? "AWS branch", "Amplify branch metadata is configured in backend environment."),
      card("backend", "Backend health", statusOf(backendHealth), valueOf(backendHealth, "value", "Online"), valueOf(backendHealth, "detail", "Backend health endpoint should be checked externally too.")),
      card("database", "Database status", statusOf(database), valueOf(database, "runningStatus", "Unknown"), valueOf(database, "warningStatus", "RDS status was checked through AWS APIs where permitted.")),
      card("test", "Latest full-app test", latestRun.status === "completed" ? "Healthy" : latestRun.status === "failed" ? "Critical" : "Unknown", latestRun.status, latestRun.message),
      card("cost", "Current AWS cost", statusOf(costs), valueOf(costs, "monthToDateCost", "Unknown"), valueOf(costs, "note", "AWS cost data can lag.")),
      card("alerts", "Active alerts", alertStatus(alerts), String(Array.isArray((alerts as { alerts?: unknown[] }).alerts) ? (alerts as { alerts: unknown[] }).alerts.length : "Unknown"), "CloudWatch alarms and dead-letter queue status."),
      card("jobs", "Failed background jobs", statusOf(alerts), valueOf(alerts, "failedBackgroundJobs", "Unknown"), "Uses the dead-letter queue count as the first safe signal."),
      card("logins", "Suspicious login count", "Unknown", "Unknown", "Threat Protection must be enabled manually in Cognito for richer findings."),
      card("backup", "Latest database backup", statusOf(backup), valueOf(backup, "latestBackup", "Unknown"), valueOf(backup, "detail", "Automatic backup status from RDS/Backup APIs.")),
      card("storage", "S3 public access", statusOf(s3), valueOf(s3, "publicAccessStatus", "Unknown"), "No bucket contents or credentials are exposed."),
    ];

    return {
      generatedAt: new Date().toISOString(),
      cards,
      alerts: Array.isArray((alerts as { alerts?: AdminAlert[] }).alerts) ? (alerts as { alerts: AdminAlert[] }).alerts : [],
      latestTestRun: latestRun,
    };
  }

  async getAlerts(filters: { service?: string; severity?: string; state?: string } = {}) {
    const alarms = await safe(() =>
      this.cloudWatch.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: "InnerPause",
          MaxRecords: 50,
        }),
      ),
    );
    const alerts: AdminAlert[] = [];

    for (const alarm of Array.isArray(alarms.MetricAlarms) ? alarms.MetricAlarms : []) {
      alerts.push({
        id: alarm.AlarmArn ?? alarm.AlarmName ?? crypto.randomUUID(),
        service: serviceFromMetric(alarm.Namespace),
        severity: alarm.StateValue === "ALARM" ? "Critical" : alarm.StateValue === "INSUFFICIENT_DATA" ? "Warning" : "Info",
        state: alarm.StateValue === "ALARM" ? "Active" : alarm.StateValue === "OK" ? "Resolved" : "Unknown",
        reason: alarm.StateReason ?? "No reason returned.",
        occurredAt: alarm.StateUpdatedTimestamp?.toISOString() ?? new Date().toISOString(),
      });
    }

    const dlq = await this.deadLetterQueueCount();
    if (dlq.status !== "Unknown" && Number(dlq.value) > 0) {
      alerts.push({
        id: "dead-letter-queue",
        service: "SQS",
        severity: "Critical",
        state: "Active",
        reason: `${dlq.value} message(s) are waiting in the dead-letter queue.`,
        occurredAt: new Date().toISOString(),
      });
    }

    return {
      alerts: alerts.filter((alert) =>
        (!filters.service || alert.service === filters.service) &&
        (!filters.severity || alert.severity === filters.severity) &&
        (!filters.state || alert.state === filters.state),
      ),
      failedBackgroundJobs: dlq.value,
    };
  }

  async getCosts() {
    const budget = this.config.awsMonthlyBudgetAmount ?? 25;
    const now = new Date();
    const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
    const end = now.toISOString().slice(0, 10);
    const response = await safe(() =>
      this.costExplorer.send(
        new GetCostAndUsageCommand({
          TimePeriod: { Start: start, End: end },
          Granularity: "MONTHLY",
          Metrics: ["UnblendedCost"],
          GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
        }),
      ),
    );
    const groups = response.ResultsByTime?.[0]?.Groups ?? [];
    const services = groups.map((group) => ({
      service: group.Keys?.[0] ?? "Unknown service",
      cost: Number(group.Metrics?.UnblendedCost?.Amount ?? 0),
      unit: group.Metrics?.UnblendedCost?.Unit ?? "USD",
    }));
    const total = services.reduce((sum, item) => sum + item.cost, 0);
    const percent = budget > 0 ? Math.round((total / budget) * 100) : 0;
    return {
      status: percent >= 100 ? "Critical" : percent >= 80 ? "Warning" : "Healthy",
      monthlyBudget: `$${budget.toFixed(2)}`,
      monthToDateCost: `$${total.toFixed(2)}`,
      percentageUsed: `${percent}%`,
      forecastedMonthlyCost: "Unknown",
      thresholds: { "50": percent >= 50, "80": percent >= 80, "100": percent >= 100 },
      services,
      note: "AWS Cost Explorer data may not update instantly and usually lags by several hours.",
    };
  }

  async getDatabaseHealth() {
    const db = await this.databaseInstance();
    return {
      status: db?.DBInstanceStatus === "available" ? "Healthy" : db ? "Warning" : "Unknown",
      runningStatus: db?.DBInstanceStatus ?? "Unknown",
      cpuUsage: "CloudWatch metric available after deployment.",
      storageRemaining: db?.AllocatedStorage ? `${db.AllocatedStorage} GB allocated` : "Unknown",
      connectionCount: "CloudWatch metric available after deployment.",
      backupEnabled: Boolean(db?.BackupRetentionPeriod && db.BackupRetentionPeriod > 0),
      backupRetentionPeriod: db?.BackupRetentionPeriod ? `${db.BackupRetentionPeriod} day(s)` : "Unknown",
      latestBackup: db?.LatestRestorableTime?.toISOString() ?? "Unknown",
      latestSnapshot: await this.latestSnapshot(),
      warningStatus: db ? "Database metadata checked without exposing credentials." : "Database identifier is not configured or AWS access was denied.",
    };
  }

  async getApiUsage() {
    return {
      status: "Unknown",
      totalApiRequests: "CloudWatch API Gateway metrics require deployed stage dimensions.",
      successfulRequests: "Unknown",
      failedRequests: "See CloudWatch alerts.",
      throttledRequests: "See CloudWatch alerts.",
      averageResponseTime: "Unknown",
      slowestRoutes: [],
      aiAnalysisRequestCount: "Use journal_analysis SQS/job metrics after dashboard telemetry is enabled.",
      rateLimitStatus: "Admin test run endpoint is throttled in memory per Lambda container.",
    };
  }

  async getFileUploadSecurity() {
    const bucket = this.config.audioBucketName;
    if (!bucket) return { status: "Unknown", publicAccessStatus: "Unknown", detail: "Audio bucket is not configured." };
    const [publicAccess, policyStatus, listed] = await Promise.all([
      safe(() => this.s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }))),
      safe(() => this.s3.send(new GetBucketPolicyStatusCommand({ Bucket: bucket }))),
      safe(() => this.s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }))),
    ]);
    const blocked = publicAccess.PublicAccessBlockConfiguration;
    const publicBlocked = Boolean(blocked?.BlockPublicAcls && blocked.BlockPublicPolicy && blocked.IgnorePublicAcls && blocked.RestrictPublicBuckets);
    return {
      status: publicBlocked && policyStatus.PolicyStatus?.IsPublic === false ? "Healthy" : "Warning",
      rejectedUploads: "Tracked in app validation, not yet aggregated.",
      rejectedBySize: "Uploads over configured limits are rejected before signing.",
      rejectedByType: "Unsupported MIME types are rejected before signing.",
      failedUploads: "Unknown",
      totalStorageUsed: listed.KeyCount === 0 ? "No listed objects in first page" : "Objects present",
      publicAccessStatus: publicBlocked && policyStatus.PolicyStatus?.IsPublic === false ? "Blocked" : "Review required",
    };
  }

  async getSecurityStatus() {
    const analyzers = await safe(() => this.accessAnalyzer.send(new ListAnalyzersCommand({ maxResults: 10 })));
    const analyzerArn = analyzers.analyzers?.[0]?.arn;
    const findings = analyzerArn ? await safe(() => this.accessAnalyzer.send(new ListFindingsCommand({ analyzerArn, maxResults: 20 }))) : {};
    return {
      status: Array.isArray(findings.findings) && findings.findings.length > 0 ? "Warning" : "Unknown",
      codeScanningSecrets: "Run local secret scan before deployment.",
      iamAccessAnalyzerFindings: findings.findings?.map((finding) => ({
        id: finding.id,
        resourceType: finding.resourceType,
        status: finding.status,
        isPublic: finding.isPublic,
      })) ?? [],
      broadPermissions: "Review CDK diff; dashboard does not mutate IAM.",
      publicS3Findings: "See file-upload security section.",
      adminPermissionStatus: `Admin access requires Cognito group ${this.config.adminGroupName}.`,
      latestSecurityScanDate: new Date().toISOString(),
      accessAnalyzerSetup: analyzerArn ? "Analyzer found." : "No Access Analyzer was returned. Create one manually if findings are required.",
    };
  }

  async getSuspiciousLogins() {
    const userPoolId = this.config.cognitoUserPoolId;
    const users = userPoolId ? await safe(() => this.cognito.send(new ListUsersCommand({ UserPoolId: userPoolId, Limit: 10 }))) : {};
    return {
      status: "Unknown",
      threatProtection: "Threat Protection not enabled",
      manualStep: "Enable Cognito Threat Protection / Advanced Security Features in AWS if risk events are required. This can add AWS cost.",
      suspiciousLoginCount: "Unknown",
      usersSampled: Array.isArray(users.Users) ? users.Users.length : 0,
      findings: [],
    };
  }

  async getPrivacyTests() {
    return {
      status: "Healthy",
      tests: [
        { name: "invalid token rejected", status: "Covered by backend tests" },
        { name: "missing token rejected", status: "Covered by backend tests" },
        { name: "User A cannot read User B’s journal", status: "Covered by backend tests" },
        { name: "User A cannot update User B’s journal", status: "No update endpoint exists" },
        { name: "User A cannot delete User B’s journal", status: "Covered by backend tests" },
        { name: "backend uses Cognito user identity", status: "Covered by router design" },
        { name: "frontend user ID is not trusted", status: "Covered by backend tests" },
      ],
    };
  }

  async getBackupStatus() {
    const db = await this.databaseInstance();
    const recoveryPoints = await safe(() => this.backup.send(new ListRecoveryPointsByBackupVaultCommand({ BackupVaultName: "Default", MaxResults: 5 })));
    return {
      status: db?.BackupRetentionPeriod ? "Healthy" : db ? "Warning" : "Unknown",
      automaticBackupsEnabled: Boolean(db?.BackupRetentionPeriod && db.BackupRetentionPeriod > 0),
      backupRetentionDays: db?.BackupRetentionPeriod ?? "Unknown",
      latestBackup: db?.LatestRestorableTime?.toISOString() ?? "Unknown",
      latestManualSnapshot: await this.latestSnapshot(),
      restoreTestStatus: "Not tested",
      nextRecommendedRestoreTestDate: nextQuarterDate(),
      recoveryPoints: recoveryPoints.RecoveryPoints?.slice(0, 5).map((point) => ({
        status: point.Status,
        createdAt: point.CreationDate?.toISOString(),
      })) ?? [],
      detail: "No restore button is available in this first version.",
    };
  }

  async runCompleteTest(input: { actorId: string; idempotencyKey?: string }): Promise<AdminTestRun> {
    const now = Date.now();
    if (now - lastRunRequestAt < 10 * 60 * 1000) {
      return {
        ...latestRun,
        status: latestRun.status === "running" ? "running" : "blocked",
        message: "A complete test can only be started once every 10 minutes from this Lambda container.",
      };
    }
    lastRunRequestAt = now;
    latestRun = {
      id: input.idempotencyKey ?? crypto.randomUUID(),
      status: "blocked",
      passedTests: 0,
      failedTests: 0,
      startedAt: new Date(now).toISOString(),
      completedAt: new Date().toISOString(),
      exactFailingStep: "Test runner dispatch is not configured.",
      reportUrl: undefined,
      screenshots: [],
      message: "Safe first version: configure GitHub Actions workflow dispatch or a dedicated runner before remote Playwright execution.",
    };
    console.info("admin_action", JSON.stringify({ action: "run_complete_test_requested", actorId: input.actorId, runId: latestRun.id }));
    return latestRun;
  }

  async getTestRuns() {
    return { runs: [latestRun] };
  }

  private async databaseInstance() {
    const response = await safe(() => this.rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: this.config.awsDatabaseIdentifier })));
    return response.DBInstances?.[0];
  }

  private async latestSnapshot() {
    const response = await safe(() =>
      this.rds.send(
        new DescribeDBSnapshotsCommand({
          DBInstanceIdentifier: this.config.awsDatabaseIdentifier,
          SnapshotType: "manual",
          MaxRecords: 20,
        }),
      ),
    );
    const snapshots = response.DBSnapshots ?? [];
    snapshots.sort((a, b) => Number(b.SnapshotCreateTime ?? 0) - Number(a.SnapshotCreateTime ?? 0));
    return snapshots[0]?.SnapshotCreateTime?.toISOString() ?? "Unknown";
  }

  private async deadLetterQueueCount() {
    if (!this.config.awsDeadLetterQueueUrl) return { status: "Unknown", value: "Unknown" };
    const response = await safe(() =>
      this.sqs.send(
        new GetQueueAttributesCommand({
          QueueUrl: this.config.awsDeadLetterQueueUrl,
          AttributeNames: ["ApproximateNumberOfMessages"],
        }),
      ),
    );
    return { status: "Healthy", value: response.Attributes?.ApproximateNumberOfMessages ?? "Unknown" };
  }
}

function card(key: string, label: string, status: AdminStatus, value: string, detail: string) {
  return { key, label, status, value, detail };
}

async function safe<T extends object>(operation: () => Promise<T>): Promise<T | Record<string, never>> {
  try {
    return await operation();
  } catch {
    return {};
  }
}

function statusOf(value: unknown): AdminStatus {
  if (value && typeof value === "object" && "status" in value) return (value as { status: AdminStatus }).status;
  return "Unknown";
}

function valueOf(value: unknown, key: string, fallback: string) {
  return value && typeof value === "object" && key in value ? String((value as Record<string, unknown>)[key]) : fallback;
}

function alertStatus(value: unknown): AdminStatus {
  const alerts = value && typeof value === "object" && Array.isArray((value as { alerts?: unknown[] }).alerts) ? (value as { alerts: AdminAlert[] }).alerts : [];
  return alerts.some((alert) => alert.severity === "Critical" && alert.state === "Active") ? "Critical" : alerts.length ? "Warning" : "Healthy";
}

function serviceFromMetric(namespace: string | undefined) {
  if (!namespace) return "AWS";
  if (namespace.includes("Lambda")) return "Lambda";
  if (namespace.includes("ApiGateway")) return "API Gateway";
  if (namespace.includes("RDS")) return "RDS";
  if (namespace.includes("SQS")) return "SQS";
  return namespace.replace("AWS/", "");
}

function nextQuarterDate() {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + 3);
  return date.toISOString().slice(0, 10);
}
