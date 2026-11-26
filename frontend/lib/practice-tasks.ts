// A Practice path's small daily tasks: which one each day gives you, what
// worked, and coming back after time away. No imports beyond types, so the
// rules are tested directly (tests/practice-tasks.test.mjs).

export type TaskAnswer = "yes" | "partly" | "not-yet";

interface TaskCheckIn {
  day: number;
  taskAnswer?: TaskAnswer;
}

/**
 * The task day `day` gives you at its end: the day's own, unless today's
 * check in said "Not yet" about the last one. Then it stays with you one
 * more day, said kindly, before the path moves on.
 */
export function taskFor(actions: string[], checkIns: TaskCheckIn[], day: number): { task: string; carried: boolean } {
  const own = { task: actions[day - 1] ?? "", carried: false };
  if (day <= 1) return own;
  const answer = checkIns.find((item) => item.day === day)?.taskAnswer;
  const previous = taskFor(actions, checkIns, day - 1);
  return answer === "not-yet" && !previous.carried ? { task: previous.task, carried: true } : own;
}

/** The tasks you said you did (or, failing that, partly did): the path's keepsake. */
export function tasksThatWorked(actions: string[], checkIns: TaskCheckIn[]): string[] {
  const answered = (answer: TaskAnswer) =>
    checkIns
      .filter((item) => item.day > 1 && item.taskAnswer === answer)
      .sort((a, b) => a.day - b.day)
      .map((item) => taskFor(actions, checkIns, item.day - 1).task);
  const done = answered("yes");
  return [...new Set(done.length > 0 ? done : answered("partly"))].filter(Boolean);
}

/**
 * Whole calendar days skipped since you were last on the path (its last
 * completed day, or the day you started): 0 when you were here yesterday or today.
 */
export function daysAway(lastActivity: string, now = new Date()) {
  const last = new Date(lastActivity);
  const from = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
  const to = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((to - from) / 86_400_000) - 1);
}
