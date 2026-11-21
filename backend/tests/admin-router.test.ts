import assert from "node:assert/strict";
import test from "node:test";
import type { AdminDashboardProvider } from "../src/services/admin-dashboard.js";
import { ApiRouter } from "../src/routes/router.js";

const normalHeaders = { authorization: "Bearer test-user-a", "x-request-id": "req-normal" };
const adminHeaders = { authorization: "Bearer test-admin", "x-request-id": "req-admin" };

const provider: AdminDashboardProvider = {
  async getOverview() {
    return {
      generatedAt: new Date(0).toISOString(),
      cards: [{ key: "backend", label: "Backend", status: "Healthy", value: "Online", detail: "No secret values." }],
      alerts: [],
      latestTestRun: { id: "run-1", status: "idle", passedTests: 0, failedTests: 0, screenshots: [], message: "No run." },
    };
  },
  async getAlerts() {
    return { alerts: [] };
  },
  async getCosts() {
    return { status: "Healthy", secret: "should-not-be-in-real-provider" };
  },
  async getDatabaseHealth() {
    return { status: "Healthy" };
  },
  async getApiUsage() {
    return { status: "Unknown" };
  },
  async getFileUploadSecurity() {
    return { status: "Healthy", publicAccessStatus: "Blocked" };
  },
  async getSecurityStatus() {
    return { status: "Healthy", latestSecurityScanDate: new Date(0).toISOString() };
  },
  async getSuspiciousLogins() {
    return { status: "Unknown", threatProtection: "Threat Protection not enabled" };
  },
  async getPrivacyTests() {
    return { status: "Healthy" };
  },
  async getBackupStatus() {
    return { status: "Healthy" };
  },
  async runCompleteTest() {
    return { id: "run-2", status: "blocked", passedTests: 0, failedTests: 0, screenshots: [], message: "Dispatch not configured." };
  },
  async getTestRuns() {
    return { runs: [] };
  },
};

function router() {
  return new ApiRouter({ adminProvider: provider });
}

test("admin overview rejects unauthenticated users", async () => {
  const response = await router().handle({ method: "GET", path: "/api/v1/admin/overview", headers: {}, requestId: "req-no-auth" });
  assert.equal(response.statusCode, 401);
});

test("admin overview rejects normal users", async () => {
  const response = await router().handle({ method: "GET", path: "/api/v1/admin/overview", headers: normalHeaders, requestId: "req-normal" });
  assert.equal(response.statusCode, 403);
});

test("admin overview allows admin group users", async () => {
  const response = await router().handle({ method: "GET", path: "/api/v1/admin/overview", headers: adminHeaders, requestId: "req-admin" });
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Healthy/);
});

test("admin API rejects invalid tokens", async () => {
  const response = await router().handle({ method: "GET", path: "/api/v1/admin/overview", headers: { authorization: "Bearer invalid" }, requestId: "req-invalid" });
  assert.equal(response.statusCode, 401);
});

test("full-app test button cannot be spammed by normal users", async () => {
  const response = await router().handle({ method: "POST", path: "/api/v1/admin/test-runs", headers: normalHeaders, requestId: "req-spam" });
  assert.equal(response.statusCode, 403);
});

test("admin full-app test endpoint returns a safe blocked setup state", async () => {
  const response = await router().handle({ method: "POST", path: "/api/v1/admin/test-runs", headers: adminHeaders, requestId: "req-run" });
  assert.equal(response.statusCode, 202);
  assert.match(response.body, /Dispatch not configured|blocked/);
});

test("admin response contains no obvious secret value", async () => {
  const response = await router().handle({ method: "GET", path: "/api/v1/admin/security", headers: adminHeaders, requestId: "req-secret" });
  assert.equal(response.statusCode, 200);
  assert.doesNotMatch(response.body, /AKIA|OPENAI_API_KEY|database password/i);
});
