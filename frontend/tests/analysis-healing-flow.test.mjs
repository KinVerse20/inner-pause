import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const analysis = await readFile(new URL("../components/analysis-screen.tsx", import.meta.url), "utf8");
const healingPlan = await readFile(new URL("../components/healing-plan-screen.tsx", import.meta.url), "utf8");
const player = await readFile(new URL("../components/healing-audio-player-screen.tsx", import.meta.url), "utf8");
const authProvider = await readFile(new URL("../lib/auth/auth-provider.tsx", import.meta.url), "utf8");

test("analysis uses one concise summary with the two approved choices", () => {
  assert.match(analysis, /Here&ap(?:os|#39);s what we noticed|Here&apos;s what we noticed/);
  assert.match(analysis, />\s*Read More\s*</);
  assert.match(analysis, />\s*Begin Healing\s*</);
  assert.match(analysis, /analysis\.emotions\.slice\(0, 4\)/);
  assert.match(analysis, /createConciseSummary/);
  assert.doesNotMatch(analysis, /Your personalised healing journey is taking shape|View topology|TransformStream/);
});

test("Begin Healing bypasses the healing-ready screen and opens sound selection", () => {
  assert.match(analysis, /router\.push\(`\/healing\/player\?plan=\$\{plan\.id\}`\)/);
  assert.doesNotMatch(analysis, /router\.push\(`\/healing\?entry=/);
  assert.match(player, /useState\(true\)/);
  assert.match(player, /What would you like to listen to\?/);
  assert.match(healingPlan, /Your healing journey is ready/);
});

test("Read More exposes detailed chakra reasoning without blocking healing", () => {
  assert.match(analysis, /aria-controls="analysis-details"/);
  assert.match(analysis, /association\.reason/);
  assert.match(analysis, /association\.sessionSupport/);
  assert.match(analysis, /analysis\.healingApproachSummary/);
});

test("failed Cognito restoration clears a stale cached profile", () => {
  const restore = authProvider.slice(authProvider.indexOf("async function restore"), authProvider.indexOf("const value:"));
  assert.match(restore, /await getService\(\)\.refresh/);
  assert.match(restore, /const user = await api\.me\(\)/);
  assert.match(restore, /catch \{[\s\S]*clearFrontendSession\(\);[\s\S]*setProfile\(null\)/);
  assert.doesNotMatch(restore, /if \(existing\) setProfile\(existing\)/);
});
