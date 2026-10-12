import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function loadBackendEnv() {
  const cwd = process.cwd();
  loadEnvFile(resolve(cwd, ".env"));
  loadEnvFile(resolve(cwd, ".env.local"));
  loadEnvFile(resolve(cwd, "../.env"));
  loadEnvFile(resolve(cwd, "../.env.local"));
}

export function getPort() {
  const parsed = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4000;
}

export function allowedOrigins(): string[] {
  const fromEnv = (process.env.FRONTEND_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(["http://localhost:3000", "http://127.0.0.1:3000", ...fromEnv])];
}
