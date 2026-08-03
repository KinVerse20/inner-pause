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

