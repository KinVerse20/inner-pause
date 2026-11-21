import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const clients = new Map<string, LambdaClient>();

export async function invokeLambdaJson<TResponse>(input: {
  functionName: string;
  region: string;
  payload: unknown;
}): Promise<TResponse> {
  const client = getLambdaClient(input.region);
  const response = await client.send(
    new InvokeCommand({
      FunctionName: input.functionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(input.payload)),
    }),
  );

  const payloadText = response.Payload ? Buffer.from(response.Payload).toString("utf8") : "";
  if (response.FunctionError) {
    throw new Error(readInvokeError(payloadText) ?? `Lambda invoke failed: ${response.FunctionError}`);
  }

  if (!payloadText) return {} as TResponse;

  const parsed = JSON.parse(payloadText) as { errorMessage?: string } | TResponse;
  if (parsed && typeof parsed === "object" && "errorMessage" in parsed && typeof parsed.errorMessage === "string") {
    throw new Error(parsed.errorMessage);
  }
  return parsed as TResponse;
}

function getLambdaClient(region: string) {
  let client = clients.get(region);
  if (!client) {
    client = new LambdaClient({ region });
    clients.set(region, client);
  }
  return client;
}

function readInvokeError(payloadText: string) {
  if (!payloadText) return undefined;
  try {
    const parsed = JSON.parse(payloadText) as { errorMessage?: string };
    return typeof parsed.errorMessage === "string" ? parsed.errorMessage : undefined;
  } catch {
    return payloadText.slice(0, 500);
  }
}
