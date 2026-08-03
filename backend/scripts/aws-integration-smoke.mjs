const baseUrl = process.env.AWS_TEST_API_BASE_URL?.replace(/\/$/, "");
const accessToken = process.env.AWS_TEST_ACCESS_TOKEN;

if (!baseUrl || !accessToken) {
  throw new Error("Set AWS_TEST_API_BASE_URL and AWS_TEST_ACCESS_TOKEN after deploying AWS test resources.");
}

const headers = {
  authorization: `Bearer ${accessToken}`,
  "content-type": "application/json",
  "x-request-id": `aws-smoke-${Date.now()}`,
};

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text).data : undefined;
}

await request("/api/v1/me");
const created = await request("/api/v1/journals", {
  method: "POST",
  body: JSON.stringify({ rawText: "Fake AWS smoke-test reflection. No real user data.", emotionalIntensityBefore: 4 }),
});
const journalId = created.journal.id;
await request(`/api/v1/journals/${journalId}`);
await request(`/api/v1/journals/${journalId}/analyse`, {
  method: "POST",
  headers: { "idempotency-key": `aws-smoke-analysis-${journalId}` },
});

console.log("AWS smoke-test preparation succeeded. Continue with job polling and worker/DLQ checks in CloudWatch.");
