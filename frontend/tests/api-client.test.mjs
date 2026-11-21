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

test("authenticated me request sends the configured Cognito API token", async () => {
  let captured;
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    getAccessToken: () => "id-token-123",
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ data: { id: "user-1", email: "user@example.com" }, requestId: "req-me" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  await client.me();
  assert.equal(captured.url, "https://api.example.test/api/v1/me");
  assert.equal(captured.init.headers.authorization, "Bearer id-token-123");
});

test("authenticated quick analysis request sends the configured Cognito API token", async () => {
  let captured;
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    getAccessToken: () => "id-token-456",
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ data: { analysis: {} }, requestId: "req-analysis" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  await client.analyseText("A safe test reflection");
  assert.equal(captured.url, "https://api.example.test/api/v1/analysis/quick");
  assert.equal(captured.init.headers.authorization, "Bearer id-token-456");
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

test("maps an API Gateway 401 to a clear expired-session error", async () => {
  let unauthorised = false;
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    getAccessToken: () => "expired-token",
    onUnauthorised: () => {
      unauthorised = true;
    },
    fetchImpl: async () =>
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
  });

  await assert.rejects(
    () => client.analyseText("A safe test reflection"),
    (error) => {
      assert.equal(error.status, 401);
      assert.equal(error.code, "UNAUTHENTICATED");
      assert.equal(error.message, "Your session has expired. Please sign in again.");
      return true;
    },
  );
  assert.equal(unauthorised, true);
});

test("handles a non-JSON gateway failure without a parsing crash", async () => {
  const client = new InnerPauseApiClient({
    baseUrl: "https://api.example.test/api/v1",
    fetchImpl: async () => new Response("upstream unavailable", { status: 502 }),
  });

  await assert.rejects(
    () => client.analyseText("A safe test reflection"),
    (error) => {
      assert.equal(error.status, 502);
      assert.equal(error.message, "The request could not be completed.");
      return true;
    },
  );
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
