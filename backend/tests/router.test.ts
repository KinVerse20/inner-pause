import assert from "node:assert/strict";
import test from "node:test";
import { ApiRouter } from "../src/routes/router.js";

const headersA = { authorization: "Bearer test-user-a", "x-request-id": "req-a" };
const headersB = { authorization: "Bearer test-user-b", "x-request-id": "req-b" };

test("health endpoint is public", async () => {
  const router = new ApiRouter();
  const response = await router.handle({ method: "GET", path: "/api/v1/health", headers: {}, requestId: "req-health" });
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /innerpause-backend/);
});

test("unauthenticated requests fail", async () => {
  const router = new ApiRouter();
  const response = await router.handle({ method: "GET", path: "/api/v1/me", headers: {}, requestId: "req-auth" });
  assert.equal(response.statusCode, 401);
  assert.match(response.body, /UNAUTHENTICATED/);
});

test("creates and reads a journal for the authenticated user", async () => {
  const router = new ApiRouter();
  const created = await router.handle({
    method: "POST",
    path: "/api/v1/journals",
    headers: headersA,
    requestId: "req-create",
    body: { rawText: "I need a calmer reset today.", emotionalIntensityBefore: 5 },
  });
  assert.equal(created.statusCode, 201);
  const journalId = JSON.parse(created.body).data.journal.id;

  const read = await router.handle({
    method: "GET",
    path: `/api/v1/journals/${journalId}`,
    headers: headersA,
    requestId: "req-read",
  });
  assert.equal(read.statusCode, 200);
  assert.equal(JSON.parse(read.body).data.id, journalId);
});

test("User A cannot access User B journals", async () => {
  const router = new ApiRouter();
  const created = await router.handle({
    method: "POST",
    path: "/api/v1/journals",
    headers: headersA,
    requestId: "req-create-a",
    body: { rawText: "Private reflection for user A." },
  });
  const journalId = JSON.parse(created.body).data.journal.id;

  const denied = await router.handle({
    method: "GET",
    path: `/api/v1/journals/${journalId}`,
    headers: headersB,
    requestId: "req-denied",
  });
  assert.equal(denied.statusCode, 403);
});

test("invalid journal requests are rejected", async () => {
  const router = new ApiRouter();
  const response = await router.handle({
    method: "POST",
    path: "/api/v1/journals",
    headers: headersA,
    requestId: "req-invalid",
    body: { rawText: "" },
  });
  assert.equal(response.statusCode, 400);
});

test("duplicate job request returns duplicate request error", async () => {
  const router = new ApiRouter();
  const created = await router.handle({
    method: "POST",
    path: "/api/v1/journals",
    headers: headersA,
    requestId: "req-create-job",
    body: { rawText: "Please analyse this reflection." },
  });
  const journalId = JSON.parse(created.body).data.journal.id;

  const first = await router.handle({
    method: "POST",
    path: `/api/v1/journals/${journalId}/analyse`,
    headers: { ...headersA, "idempotency-key": "same-click" },
    requestId: "req-job-1",
  });
  assert.equal(first.statusCode, 202);

  const second = await router.handle({
    method: "POST",
    path: `/api/v1/journals/${journalId}/analyse`,
    headers: { ...headersA, "idempotency-key": "same-click" },
    requestId: "req-job-2",
  });
  assert.equal(second.statusCode, 409);
  assert.match(second.body, /DUPLICATE_REQUEST/);
});

test("User A cannot access User B audio", async () => {
  const router = new ApiRouter();
  const audio = router.createTestAudioForUser("11111111-1111-4111-8111-111111111111");
  const denied = await router.handle({
    method: "GET",
    path: `/api/v1/audio/${audio.id}`,
    headers: headersB,
    requestId: "req-audio-denied",
  });
  assert.equal(denied.statusCode, 403);
});

