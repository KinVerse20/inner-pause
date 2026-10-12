import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const files = execFileSync("git", ["ls-files", "--others", "--cached", "--exclude-standard"], {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
  .filter((file) => !file.split("/").includes("node_modules") && !file.startsWith(".next/") && !file.includes("/cdk.out/"));

const patterns = [
  { name: "AWS access key id", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Supabase JWT-like service role", regex: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/ },
  { name: "OpenAI API key", regex: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: "Stripe secret key", regex: /sk_live_[A-Za-z0-9]{20,}/ },
];

const allowedExampleFiles = new Set([".env.example", ".env.local.example", ".env.aws.example"]);
const findings = [];

for (const file of files) {
  if (allowedExampleFiles.has(file)) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) findings.push(`${pattern.name}: ${file}`);
  }
}

if (findings.length) {
  console.error("Potential committed secrets found:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("No obvious committed secrets found.");
