import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

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

const frontendDir = process.cwd();
loadEnvFile(resolve(frontendDir, "../.env"));
loadEnvFile(resolve(frontendDir, "../.env.local"));
loadEnvFile(resolve(frontendDir, ".env"));
loadEnvFile(resolve(frontendDir, ".env.local"));

const apiOrigin = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["@inner-pause/shared"],
  experimental: {
    // Because proxy.ts exists, Next.js buffers request bodies and cuts them
    // off at 10 MB by default, which breaks /admin sound uploads forwarded
    // to the backend. Kept just above the backend's own 300 MB upload cap
    // (backend/src/sound-store.ts, sized for lossless WAV/FLAC masters),
    // which is the real limit.
    proxyClientMaxBodySize: "310mb",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
