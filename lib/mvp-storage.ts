"use client";

import { createHealingPlan } from "@/lib/healing-engine";
import { EmotionalAnalysis, HealingPlan, HealingProfile, JournalEntry, MvpState, SaveMode, SessionFeedback } from "@/lib/mvp-types";

const MVP_KEY = "chakra-healing-mvp";
const MVP_EVENT = "chakra-healing-mvp-change";

const defaultProfile: HealingProfile = {
  fullName: "",
  email: "",
  phone: "",
  onboardingCompleted: false,
  preferredSessionDuration: 20,
  preferredVoice: "Soft guide",
  preferredMusicStyle: "Cosmic ambient",
  preferredGuidanceLevel: "Balanced",
  affirmationsEnabled: true,
  natureSoundsEnabled: false,
  aiMemoryEnabled: true,
  morningGuidanceEnabled: false,
  guidanceTime: "08:00",
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

export function readMvpState(): MvpState {
  if (!isBrowser()) return defaultMvpState;
  try {
    const raw = window.localStorage.getItem(MVP_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedState = defaultMvpState;
      return cachedState;
    }
    if (raw === cachedRaw) return cachedState;
    const parsed = JSON.parse(raw) as Partial<MvpState>;
    cachedRaw = raw;
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
  if (raw === cachedRaw) return;
  window.localStorage.setItem(MVP_KEY, raw);
  cachedRaw = raw;
  cachedState = state;
  window.dispatchEvent(new Event(MVP_EVENT));
}

export function subscribeMvpState(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  const storageHandler = (event: StorageEvent) => {
    if (event.key === MVP_KEY) callback();
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

export function saveAnalysis(entryId: string, analysis: EmotionalAnalysis) {
  updateJournalEntry(entryId, { analysis });
}

export function savePlan(entryId: string, selectedDuration: number | "full" = "full") {
  const state = readMvpState();
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry?.analysis) return null;
  const plan = createHealingPlan(entry, entry.analysis, selectedDuration);
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
