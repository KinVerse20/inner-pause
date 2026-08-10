import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const home = await readFile(new URL("../components/mvp-home-screen.tsx", import.meta.url), "utf8");
const expression = await readFile(new URL("../components/expression-panel.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const { expressionActions } = await import("../lib/expression-actions.ts");

test("Arrive is a fresh start with exactly the three approved actions", () => {
  assert.match(home, /What are you carrying today\?/);
  assert.match(home, /We are here\\nto make you\\nfeel lighter/);
  assert.match(home, /label="Speak"[\s\S]*\/journal\?mode=speak/);
  assert.match(home, /label="Write"[\s\S]*\/journal\?mode=write/);
  assert.match(home, /label="I need immediate relief"/);
  assert.equal([...home.matchAll(/<HomeAction/g)].length, 3);
  assert.doesNotMatch(home, /useMvpState|RitualWeatherCard|Emotional weather|Clear Night|latestReflection|previous trigger/i);
});

test("shared expression screen supports both approved modes", () => {
  assert.match(expression, /Write to release/);
  assert.match(expression, /Let it out gently/);
  assert.match(expression, /Speak to release/);
  assert.match(expression, /Say it out gently/);
  assert.match(expression, /switchMode\("speak"\)/);
  assert.match(expression, /switchMode\("write"\)/);
  assert.match(expression, /aria-pressed=\{mode === "speak"\}/);
  assert.match(expression, /aria-pressed=\{mode === "write"\}/);
});

test("expression action definitions contain the approved copy", () => {
  assert.equal(expressionActions.insight.label, "Get AI insight");
  assert.equal(expressionActions.private.label, "Save as private release");
  assert.equal(expressionActions.reset.label, "Start over");
  assert.deepEqual(expressionActions.insight.points, ["Identifies emotions", "Maps affected chakras", "Suggests a healing path"]);
});

test("insight analyses, private save does not, and start over clears input", () => {
  const submit = expression.slice(expression.indexOf("const submit"), expression.indexOf("const savePrivate"));
  const savePrivate = expression.slice(expression.indexOf("const savePrivate"), expression.indexOf("const startOver"));
  const startOver = expression.slice(expression.indexOf("const startOver"), expression.indexOf("const switchMode"));

  assert.match(submit, /api\.analyseText/);
  assert.match(submit, /saveMode: "temporary_analysis"/);
  assert.match(savePrivate, /saveMode: "journal_without_analysis"/);
  assert.doesNotMatch(savePrivate, /analyseText|saveAnalysis|savePlan/);
  assert.match(startOver, /setText\(""\)/);
  assert.match(startOver, /setSelectedEmotions\(\[\]\)/);
});

test("info explanations and responsive/reduced-motion styles are present", () => {
  assert.match(expression, /aria-label=\{`About \$\{definition\.label\}`\}/);
  assert.match(expression, /role="dialog"/);
  assert.match(expression, /aria-modal="true"/);
  assert.match(css, /\.expression-info-overlay/);
  assert.match(css, /@media \(max-width: 430px\) and \(max-height: 720px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.expression-ripple/);
});
