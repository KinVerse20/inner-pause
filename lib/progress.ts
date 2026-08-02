import { chakras, moods } from "@/data/chakras";
import { ChakraDefinition, ChakraId, MoodValue, ProgressState, SessionDefinition } from "@/lib/types";

export const STORAGE_KEY = "chakra-journey-progress";

export const defaultProgress: ProgressState = {
  completedSessionKeys: [],
  history: [],
  energyPoints: 0,
  totalMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  badges: [],
};

export const getSessionKey = (chakraId: ChakraId, sessionId: string) => `${chakraId}:${sessionId}`;

export const getSessionPoints = (durationMinutes: number) => {
  if (durationMinutes === 5) return 10;
  if (durationMinutes === 10) return 20;
  if (durationMinutes === 15) return 30;
  return 40;
};

export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateGapInDays = (from: string | null, to: string) => {
  if (!from) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
};

export const getDisplayStreak = (progress: ProgressState) => {
  const today = getTodayKey();
  const gap = dateGapInDays(progress.lastCompletedDate, today);
  if (gap !== null && gap > 1) return 0;
  return progress.currentStreak;
};

export const getStreakMessage = (progress: ProgressState) => {
  const gap = dateGapInDays(progress.lastCompletedDate, getTodayKey());
  return gap !== null && gap > 1
    ? "Your journey is still here whenever you are ready."
    : null;
};

export const isChakraUnlocked = (progress: ProgressState, chakraIndex: number) => {
  if (chakraIndex === 0) return true;
  const previous = chakras[chakraIndex - 1];
  return previous.sessions.every((session) =>
    progress.completedSessionKeys.includes(getSessionKey(previous.id, session.id)),
  );
};

export const isSessionUnlocked = (
  progress: ProgressState,
  chakra: ChakraDefinition,
  sessionIndex: number,
) => {
  if (!isChakraUnlocked(progress, chakra.index)) return false;
  if (sessionIndex === 0) return true;
  const previous = chakra.sessions[sessionIndex - 1];
  return progress.completedSessionKeys.includes(getSessionKey(chakra.id, previous.id));
};

export const isSessionComplete = (
  progress: ProgressState,
  chakraId: ChakraId,
  sessionId: string,
) => progress.completedSessionKeys.includes(getSessionKey(chakraId, sessionId));

export const getCompletedChakraCount = (progress: ProgressState) =>
  chakras.filter((chakra) =>
    chakra.sessions.every((session) => isSessionComplete(progress, chakra.id, session.id)),
  ).length;

export const getCurrentChakra = (progress: ProgressState) =>
  chakras.find((chakra) => isChakraUnlocked(progress, chakra.index) && !isChakraComplete(progress, chakra.id)) ??
  chakras[chakras.length - 1];

export const isChakraComplete = (progress: ProgressState, chakraId: ChakraId) => {
  const chakra = chakras.find((item) => item.id === chakraId);
  return chakra ? chakra.sessions.every((session) => isSessionComplete(progress, chakraId, session.id)) : false;
};

export const getNextSession = (progress: ProgressState) => {
  for (const chakra of chakras) {
    if (!isChakraUnlocked(progress, chakra.index)) continue;
    for (const session of chakra.sessions) {
      if (!isSessionComplete(progress, chakra.id, session.id)) {
        return { chakra, session };
      }
    }
  }
  return null;
};

export const getMoodMeta = (mood: MoodValue) => moods.find((item) => item.value === mood) ?? moods[2];

export const getMoodShift = (before: MoodValue, after: MoodValue) =>
  getMoodMeta(after).score - getMoodMeta(before).score;

export const completeSession = ({
  progress,
  chakra,
  session,
  moodBefore,
  moodAfter,
}: {
  progress: ProgressState;
  chakra: ChakraDefinition;
  session: SessionDefinition;
  moodBefore: MoodValue;
  moodAfter: MoodValue;
}): { next: ProgressState; awardedBadge?: string; streakReset: boolean } => {
  const sessionKey = getSessionKey(chakra.id, session.id);
  if (progress.completedSessionKeys.includes(sessionKey)) {
    return { next: progress, streakReset: false };
  }

  const today = getTodayKey();
  const gap = dateGapInDays(progress.lastCompletedDate, today);
  const isNewDay = progress.lastCompletedDate !== today;
  const streakReset = gap !== null && gap > 1;
  const currentStreak = !isNewDay
    ? progress.currentStreak
    : gap === null
      ? 1
      : gap === 1
        ? progress.currentStreak + 1
        : 1;

  const basePoints = getSessionPoints(session.durationMinutes);
  const energyPoints = basePoints + 5;
  const completedSessionKeys = [...progress.completedSessionKeys, sessionKey];
  const badgeAwarded =
    chakra.sessions.every((item) => completedSessionKeys.includes(getSessionKey(chakra.id, item.id))) &&
    !progress.badges.includes(chakra.badge)
      ? chakra.badge
      : undefined;

  const next: ProgressState = {
    ...progress,
    completedSessionKeys,
    energyPoints: progress.energyPoints + energyPoints,
    totalMinutes: progress.totalMinutes + session.durationMinutes,
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastCompletedDate: today,
    badges: badgeAwarded ? [...progress.badges, badgeAwarded] : progress.badges,
    history: [
      {
        sessionKey,
        chakraId: chakra.id,
        chakraName: chakra.name,
        sessionName: session.name,
        completedAt: new Date().toISOString(),
        durationMinutes: session.durationMinutes,
        moodBefore,
        moodAfter,
        energyPoints,
      },
      ...progress.history,
    ],
  };

  return { next, awardedBadge: badgeAwarded, streakReset };
};
