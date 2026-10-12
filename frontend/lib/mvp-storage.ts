"use client";

import { createHealingPlan } from "@/lib/healing-engine";
import { EmotionalAnalysis, HealingPlan, HealingPlanCustomisation, HealingProfile, JournalEntry, MvpState, Reminder, SaveMode, SessionFeedback } from "@/lib/mvp-types";

const MVP_KEY = "chakra-healing-mvp";
const MVP_USER_KEY = "innerpause-current-user-id";
const MVP_EVENT = "chakra-healing-mvp-change";

const defaultReminders: Reminder[] = [
  { id: "morning-pause", label: "Morning Pause", time: "08:00", days: "Weekdays", enabled: true },
  { id: "midday-reset", label: "Midday Reset", time: "13:00", days: "Weekdays", enabled: true },
  { id: "evening-wind-down", label: "Evening Wind Down", time: "21:30", days: "Daily", enabled: true },
];

const defaultProfile: HealingProfile = {
  fullName: "",
  email: "",
  phone: "",
  onboardingCompleted: false,
  concerns: [],
  dailyGoal: "",
  preferredSessionDuration: 20,
  preferredVoice: "Soft guide",
  preferredMusicStyle: "Cosmic ambient",
  preferredGuidanceLevel: "Balanced",
  affirmationsEnabled: true,
  natureSoundsEnabled: false,
  aiMemoryEnabled: true,
  morningGuidanceEnabled: false,
  guidanceTime: "08:00",
  reminders: defaultReminders,
};

export const defaultMvpState: MvpState = {
  profile: defaultProfile,
  entries: [],
  activePlanId: null,
  premiumOfferSeen: false,
  morningGuidanceMessages: [],
};

const isBrowser = () => typeof window !== "undefined";
let cachedRaw: string | null = null;
let cachedState: MvpState = defaultMvpState;
let cachedKey: string | null = null;

function getMvpStorageKey() {
  if (!isBrowser()) return MVP_KEY;
  const userId = window.localStorage.getItem(MVP_USER_KEY);
  return userId ? `${MVP_KEY}:${userId}` : MVP_KEY;
}

export function setMvpAuthenticatedUser(userId: string) {
  if (!isBrowser()) return;
  const previousKey = getMvpStorageKey();
  window.localStorage.setItem(MVP_USER_KEY, userId);
  const nextKey = getMvpStorageKey();
  if (previousKey === MVP_KEY && nextKey !== MVP_KEY && !window.localStorage.getItem(nextKey)) {
    const previousState = window.localStorage.getItem(MVP_KEY);
    if (previousState) window.localStorage.setItem(nextKey, previousState);
  }
  cachedRaw = null;
  cachedKey = null;
  window.dispatchEvent(new Event(MVP_EVENT));
}

export function clearMvpAuthenticatedUser() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(MVP_USER_KEY);
  cachedRaw = null;
  cachedKey = null;
  window.dispatchEvent(new Event(MVP_EVENT));
}

export function readMvpState(): MvpState {
  if (!isBrowser()) return defaultMvpState;
  try {
    const key = getMvpStorageKey();
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      cachedRaw = null;
      cachedState = defaultMvpState;
      return cachedState;
    }
    if (raw === cachedRaw && key === cachedKey) return cachedState;
    const parsed = JSON.parse(raw) as Partial<MvpState>;
    cachedRaw = raw;
    cachedKey = key;
    cachedState = {
      ...defaultMvpState,
      ...parsed,
      profile: { ...defaultProfile, ...(parsed.profile ?? {}) },
      entries: parsed.entries ?? [],
      morningGuidanceMessages: parsed.morningGuidanceMessages ?? [],
    };
    return cachedState;
  } catch {
    return defaultMvpState;
  }
}

export function writeMvpState(state: MvpState) {
  if (!isBrowser()) return;
  const raw = JSON.stringify(state);
  const key = getMvpStorageKey();
  if (raw === cachedRaw && key === cachedKey) return;
  window.localStorage.setItem(key, raw);
  cachedRaw = raw;
  cachedKey = key;
  cachedState = state;
  window.dispatchEvent(new Event(MVP_EVENT));
}

export function subscribeMvpState(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  const storageHandler = (event: StorageEvent) => {
    if (event.key?.startsWith(MVP_KEY) || event.key === MVP_USER_KEY) callback();
  };
  window.addEventListener(MVP_EVENT, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(MVP_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export function upsertProfile(profile: Partial<HealingProfile>) {
  const state = readMvpState();
  writeMvpState({ ...state, profile: { ...state.profile, ...profile } });
}

export function deleteAllLocalMvpData() {
  writeMvpState(defaultMvpState);
}

const id = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createJournalEntry(input: {
  rawText: string;
  transcription?: string;
  saveMode: SaveMode;
  emotionalIntensityBefore: number;
}) {
  const state = readMvpState();
  const now = new Date().toISOString();
  const firstLine = input.rawText.split("\n").find(Boolean)?.slice(0, 58) || "Untitled reflection";
  const entry: JournalEntry = {
    id: id(),
    title: firstLine,
    rawText: input.rawText,
    transcription: input.transcription,
    saveMode: input.saveMode,
    isTemporary: input.saveMode === "reset_only" || input.saveMode === "temporary_analysis",
    emotionalIntensityBefore: input.emotionalIntensityBefore,
    createdAt: now,
    updatedAt: now,
  };
  writeMvpState({ ...state, entries: [entry, ...state.entries] });
  return entry;
}

export function updateJournalEntry(entryId: string, updates: Partial<JournalEntry>) {
  const state = readMvpState();
  const entries = state.entries.map((entry) =>
    entry.id === entryId ? { ...entry, ...updates, updatedAt: new Date().toISOString() } : entry,
  );
  writeMvpState({ ...state, entries });
}

export function deleteJournalEntry(entryId: string) {
  const state = readMvpState();
  writeMvpState({ ...state, entries: state.entries.filter((entry) => entry.id !== entryId) });
}

export function toggleFavouriteEntry(entryId: string) {
  const state = readMvpState();
  const entries = state.entries.map((entry) => (entry.id === entryId ? { ...entry, favourite: !entry.favourite } : entry));
  writeMvpState({ ...state, entries });
}

export function addReminder(reminder: Omit<Reminder, "id">) {
  const state = readMvpState();
  const reminders = [...state.profile.reminders, { ...reminder, id: id() }];
  writeMvpState({ ...state, profile: { ...state.profile, reminders } });
}

export function toggleReminder(reminderId: string) {
  const state = readMvpState();
  const reminders = state.profile.reminders.map((reminder) =>
    reminder.id === reminderId ? { ...reminder, enabled: !reminder.enabled } : reminder,
  );
  writeMvpState({ ...state, profile: { ...state.profile, reminders } });
}

export function removeReminder(reminderId: string) {
  const state = readMvpState();
  const reminders = state.profile.reminders.filter((reminder) => reminder.id !== reminderId);
  writeMvpState({ ...state, profile: { ...state.profile, reminders } });
}

export function saveAnalysis(entryId: string, analysis: EmotionalAnalysis) {
  updateJournalEntry(entryId, { analysis });
}

export function saveReflectionToJourney(entryId: string) {
  updateJournalEntry(entryId, { saveMode: "journal_and_analysis", isTemporary: false });
}

export function keepReflectionTemporary(entryId: string) {
  updateJournalEntry(entryId, { saveMode: "temporary_analysis", isTemporary: true });
}

export function savePlan(entryId: string, selectedDuration?: number | "full", customisation?: Partial<HealingPlanCustomisation>) {
  const state = readMvpState();
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry?.analysis) return null;
  const duration = selectedDuration ?? entry.plan?.selectedDuration ?? "full";
  const plan = createHealingPlan(entry, entry.analysis, duration, customisation);
  const entries = state.entries.map((item) => (item.id === entryId ? { ...item, plan, updatedAt: new Date().toISOString() } : item));
  writeMvpState({ ...state, entries, activePlanId: plan.id });
  return plan;
}

export function updatePlan(planId: string, updates: Partial<HealingPlan>) {
  const state = readMvpState();
  const entries = state.entries.map((entry) =>
    entry.plan?.id === planId
      ? { ...entry, plan: { ...entry.plan, ...updates }, updatedAt: new Date().toISOString() }
      : entry,
  );
  writeMvpState({ ...state, entries });
}

export function saveFeedback(planId: string, feedback: SessionFeedback) {
  const state = readMvpState();
  const entries = state.entries.map((entry) =>
    entry.plan?.id === planId
      ? {
          ...entry,
          plan: { ...entry.plan, status: "completed" as const },
          feedback,
          updatedAt: new Date().toISOString(),
        }
      : entry,
  );
  writeMvpState({ ...state, entries });
}

export function createMorningGuidanceMessage() {
  const state = readMvpState();
  const latest = state.entries.find((entry) => entry.analysis);
  const name = state.profile.fullName || "there";
  const messageText = latest
    ? `Good morning, ${name}. Yesterday, ${latest.analysis?.triggers[0]?.toLowerCase() ?? "emotional pressure"} stood out. Today, focus on one slow breath before reacting and choose one small steady action.`
    : `Good morning, ${name}. Start with one slow breath and a gentle check-in before the day begins.`;
  writeMvpState({
    ...state,
    morningGuidanceMessages: [
      {
        id: id(),
        messageText,
        scheduledFor: `${new Date().toISOString().slice(0, 10)}T${state.profile.guidanceTime}:00`,
        deliveryChannel: "mock",
        deliveryStatus: state.profile.morningGuidanceEnabled ? "mock_created" : "disabled",
        createdAt: new Date().toISOString(),
      },
      ...state.morningGuidanceMessages,
    ],
  });
}
