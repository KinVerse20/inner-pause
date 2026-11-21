import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const cache = new Map<string, string>();

export async function readSecretString(input: { region: string; secretArn: string; jsonKey?: string }): Promise<string> {
  const cacheKey = `${input.secretArn}:${input.jsonKey ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const client = new SecretsManagerClient({ region: input.region });
  const response = await client.send(new GetSecretValueCommand({ SecretId: input.secretArn }));
  const secret = response.SecretString;
  if (!secret) throw new Error("Secret value is empty.");

  const value = input.jsonKey ? readJsonSecretValue(secret, input.jsonKey) : secret;
  cache.set(cacheKey, value);
  return value;
}

function readJsonSecretValue(secret: string, jsonKey: string) {
  const parsed = JSON.parse(secret) as Record<string, unknown>;
  const value = parsed[jsonKey];
  if (typeof value !== "string" || !value) throw new Error(`Secret is missing ${jsonKey}.`);
  return value;
}
