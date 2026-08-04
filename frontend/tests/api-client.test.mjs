import assert from "node:assert/strict";
import test from "node:test";

const { InnerPauseApiClient, ApiClientError } = await import("../lib/api/client.ts");

test("attaches token, request id and idempotency key", async () => {
  let captured;
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    getAccessToken: () => "token-123",
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ data: { jobId: "job-1", status: "queued" }, requestId: "req-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const result = await client.analyseJournal("journal-1", "idem-1");

  assert.equal(result.jobId, "job-1");
  assert.equal(captured.url, "https://api.example.test/api/v1/journals/journal-1/analyse");
  assert.equal(captured.init.headers.authorization, "Bearer token-123");
  assert.equal(captured.init.headers["idempotency-key"], "idem-1");
  assert.ok(captured.init.headers["x-request-id"]);
});

test("throws structured errors and calls unauthorised hook", async () => {
  let unauthorised = false;
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    onUnauthorised: () => {
      unauthorised = true;
    },
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHENTICATED",
            message: "Sign in required.",
            requestId: "req-denied",
          },
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
  });

  await assert.rejects(() => client.me(), ApiClientError);
  assert.equal(unauthorised, true);
});

test("admin overview request uses protected admin endpoint", async () => {
  let captured;
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    getAccessToken: () => "admin-token",
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(
        JSON.stringify({
          data: {
            generatedAt: new Date(0).toISOString(),
            cards: [],
            alerts: [],
            latestTestRun: { id: "run", status: "idle", passedTests: 0, failedTests: 0, screenshots: [], message: "No run." },
          },
          requestId: "req-admin",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const result = await client.getAdminOverview();

  assert.equal(captured.url, "https://api.example.test/api/v1/admin/overview");
  assert.equal(captured.init.headers.authorization, "Bearer admin-token");
  assert.equal(result.latestTestRun.status, "idle");
});

test("run complete admin test is idempotent and protected", async () => {
  let captured;
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    getAccessToken: () => "admin-token",
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(
        JSON.stringify({
          data: { id: "run", status: "blocked", passedTests: 0, failedTests: 0, screenshots: [], message: "Runner not configured." },
          requestId: "req-run",
        }),
        { status: 202, headers: { "content-type": "application/json" } },
      );
    },
  });

  const result = await client.runAdminCompleteTest();

  assert.equal(captured.url, "https://api.example.test/api/v1/admin/test-runs");
  assert.equal(captured.init.method, "POST");
  assert.ok(captured.init.headers["idempotency-key"]);
  assert.equal(result.status, "blocked");
});
