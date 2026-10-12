import { listHighlights } from "@/lib/journey-highlights";
import { listPauseRecords } from "@/lib/pause-storage";
import { practiceSkillMap } from "@/lib/practice-skills";
import { listEnrollments } from "@/lib/practice-storage";

// Journey — Growth (this slice's brief §6): computed on read from existing
// Pause/Highlight/Practice history, never a separately maintained ledger,
// never an invented score. Every statement here is a plain, honest
// aggregation — if there isn't enough history for a given statement, it's
// simply not shown, rather than padded with something invented.
export interface GrowthStatement {
  id: string;
  text: string;
}

const FEEDBACK_RANK: Record<string, number> = { "not-better": 0, same: 1, better: 2 };
const MIN_RESPONSE_SAMPLE = 3;

function practiceMilestoneStatements(): GrowthStatement[] {
  return listEnrollments()
    .filter((enrollment) => enrollment.milestoneEarnedAt)
    .map((enrollment) => ({
      id: `milestone:${enrollment.skillId}`,
      text: `You completed the core ${practiceSkillMap[enrollment.skillId].label.toLowerCase()} practice.`,
    }));
}

function pauseResponseRateStatement(): GrowthStatement | null {
  const withFeedback = listPauseRecords().filter((record) => record.feedback);
  if (withFeedback.length < MIN_RESPONSE_SAMPLE) return null;
  const betterCount = withFeedback.filter((record) => record.feedback === "better").length;
  return {
    id: "pause-response-rate",
    text: `${betterCount} of ${withFeedback.length} Pauses you've taken helped you feel better.`,
  };
}

function reducedDifficultyStatements(): GrowthStatement[] {
  const highlights = listHighlights().filter((item) => item.feedback);
  const bySituation = new Map<string, typeof highlights>();
  for (const highlight of highlights) {
    const list = bySituation.get(highlight.title) ?? [];
    list.push(highlight);
    bySituation.set(highlight.title, list);
  }

  const statements: GrowthStatement[] = [];
  for (const [situation, group] of bySituation) {
    if (group.length < 2) continue;
    const sorted = group.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first.feedback || !last.feedback) continue;
    if (FEEDBACK_RANK[last.feedback] > FEEDBACK_RANK[first.feedback]) {
      statements.push({
        id: `improved:${situation}`,
        text: `${situation} has felt easier over time — your most recent response was better than your first.`,
      });
    }
  }
  return statements;
}

// Pass-only comparative read (docs/PRODUCT_FLOW.md §25/§36's "then vs.
// now"): only shown with enough spread to be a real comparison, never a
// score.
function comparativeStatement(): GrowthStatement | null {
  const withFeedback = listPauseRecords().filter((record) => record.feedback && record.completedAt);
  if (withFeedback.length < MIN_RESPONSE_SAMPLE * 2) return null;
  const sorted = withFeedback.slice().sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""));
  const half = Math.floor(sorted.length / 2);
  const earlier = sorted.slice(0, half);
  const later = sorted.slice(half);
  const rate = (list: typeof sorted) => list.filter((r) => r.feedback === "better").length / list.length;
  const earlierRate = rate(earlier);
  const laterRate = rate(later);
  if (laterRate <= earlierRate) return null;
  return {
    id: "comparative-then-vs-now",
    text: `Earlier on, about ${Math.round(earlierRate * 100)}% of your Pauses helped. More recently, that's ${Math.round(laterRate * 100)}%.`,
  };
}

export function computeGrowthStatements(scope: "free" | "pass"): GrowthStatement[] {
  const statements: GrowthStatement[] = [...practiceMilestoneStatements(), ...reducedDifficultyStatements()];
  const responseRate = pauseResponseRateStatement();
  if (responseRate) statements.push(responseRate);

  if (scope === "pass") {
    const comparative = comparativeStatement();
    if (comparative) statements.push(comparative);
  }

  return statements;
}
