export async function completeOpenAiJson(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: prompt,
      text: { format: { type: "json_object" } },
    }),
  });

  if (!response.ok) return null;
  return responseText((await response.json()) as ResponsesPayload);
}

interface ResponsesPayload {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}

// The raw Responses API returns text inside output[].content[] (message
// items, output_text parts). A top-level output_text exists only as a
// convenience in OpenAI's SDKs, not in the HTTP response this reads.
function responseText(payload: ResponsesPayload): string | null {
  if (typeof payload.output_text === "string" && payload.output_text) return payload.output_text;
  const text = (payload.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
  return text || null;
}
