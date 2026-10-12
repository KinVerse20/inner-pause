import { pauseCategories } from "@/lib/pause-categories";
import { practicePathMap } from "@/lib/practice-paths";
import type { ChakraId, ProgressState } from "@/lib/types";
import type { MvpState } from "@/lib/mvp-types";

export interface PauseEvent {
  timestamp: string;
  chakraId: ChakraId;
}

// Unifies the two independent completion sources into one activity timeline:
// Quick Pauses (Pause tab, tracked as feedback on mvp-storage entries) and
// structured Practice sessions (Practice tab, tracked in lib/progress.ts's
// ProgressState.history). Neither store knows about the other, so "This
// Week" / "Practice Trends" / "Time Patterns" need both merged to reflect
// everything the user actually did.
export function getCombinedPauseEvents(state: MvpState, progress: ProgressState): PauseEvent[] {
  const fromPauses: PauseEvent[] = state.entries
    .filter((entry) => entry.feedback && entry.plan?.blocks[0]?.chakraId)
    .map((entry) => ({ timestamp: entry.feedback!.createdAt, chakraId: entry.plan!.blocks[0].chakraId }));

  const fromPractice: PauseEvent[] = progress.history.map((item) => ({
    timestamp: item.completedAt,
    chakraId: item.chakraId,
  }));

  return [...fromPauses, ...fromPractice].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getWeeklyBarData(events: PauseEvent[], reference = new Date()) {
  const weekStart = startOfWeek(reference);
  const counts = new Array(7).fill(0);

  for (const event of events) {
    const time = new Date(event.timestamp);
    const daysSinceStart = Math.floor((time.getTime() - weekStart.getTime()) / 86_400_000);
    if (daysSinceStart >= 0 && daysSinceStart < 7) counts[daysSinceStart] += 1;
  }

  return dayLabels.map((label, index) => ({ label, count: counts[index] }));
}

function countInRange(events: PauseEvent[], chakraId: ChakraId, from: Date, to: Date) {
  return events.filter((event) => {
    if (event.chakraId !== chakraId) return false;
    const time = new Date(event.timestamp).getTime();
    return time >= from.getTime() && time < to.getTime();
  }).length;
}

export function getPracticeTrends(events: PauseEvent[], reference = new Date()) {
  const thisWeekStart = startOfWeek(reference);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  return pauseCategories.map((category) => {
    const thisWeek = countInRange(events, category.chakraId, thisWeekStart, reference);
    const lastWeek = countInRange(events, category.chakraId, lastWeekStart, thisWeekStart);
    const trend: "up" | "down" | "flat" = thisWeek > lastWeek ? "up" : thisWeek < lastWeek ? "down" : "flat";
    return { category, thisWeek, lastWeek, trend };
  });
}

const timeBuckets = [
  { label: "Night", range: "12AM–5AM", from: 0, to: 5 },
  { label: "Morning", range: "5AM–12PM", from: 5, to: 12 },
  { label: "Afternoon", range: "12PM–5PM", from: 12, to: 17 },
  { label: "Evening", range: "5PM–9PM", from: 17, to: 21 },
  { label: "Late Evening", range: "9PM–12AM", from: 21, to: 24 },
];

export function getTimePatterns(events: PauseEvent[]) {
  const counts = timeBuckets.map(() => 0);
  for (const event of events) {
    const hour = new Date(event.timestamp).getHours();
    const bucketIndex = timeBuckets.findIndex((bucket) => hour >= bucket.from && hour < bucket.to);
    if (bucketIndex >= 0) counts[bucketIndex] += 1;
  }
  const total = counts.reduce((sum, value) => sum + value, 0);
  const topIndex = total ? counts.indexOf(Math.max(...counts)) : -1;

  return {
    total,
    segments: timeBuckets.map((bucket, index) => ({
      label: bucket.label,
      value: counts[index],
      percent: total ? Math.round((counts[index] / total) * 100) : 0,
    })),
    topBucket: topIndex >= 0 ? timeBuckets[topIndex] : null,
  };
}

export function getTopPractice(events: PauseEvent[]) {
  if (!events.length) return null;
  const counts = new Map<ChakraId, number>();
  for (const event of events) counts.set(event.chakraId, (counts.get(event.chakraId) ?? 0) + 1);
  const [topChakra, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const category = pauseCategories.find((item) => item.chakraId === topChakra);
  const label = category?.label ?? practicePathMap[topChakra]?.label ?? "Pause";
  return { label, count };
}
