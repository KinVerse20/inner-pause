export type ChakraId =
  | "root"
  | "sacral"
  | "solar-plexus"
  | "heart"
  | "throat"
  | "third-eye"
  | "crown";

export type MoodValue = "very-low" | "low" | "neutral" | "good" | "very-good";

export interface SessionDefinition {
  id: string;
  index: number;
  type: "introduction" | "breathing" | "focus" | "affirmation" | "completion";
  name: string;
  durationMinutes: number;
  mission: string;
  instructions: string;
  prompts: string[];
  breathingPattern?: boolean;
}

export interface ChakraDefinition {
  id: ChakraId;
  index: number;
  name: string;
  color: string;
  accent: string;
  glow: string;
  gradient: string;
  meaning: string;
  purpose: string;
  frequencyLabel: string;
  audioPath: string;
  badge: string;
  affirmations: string[];
  sessions: SessionDefinition[];
}

export interface HistoryEntry {
  sessionKey: string;
  chakraId: ChakraId;
  chakraName: string;
  sessionName: string;
  completedAt: string;
  durationMinutes: number;
  moodBefore: MoodValue;
  moodAfter: MoodValue;
  energyPoints: number;
}

export interface ProgressState {
  completedSessionKeys: string[];
  history: HistoryEntry[];
  energyPoints: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  badges: string[];
}

export type RelaxMoodId =
  | "calm"
  | "sleep"
  | "focus"
  | "grounded"
  | "positive"
  | "emotionally-lighter"
  | "confidence"
  | "express-myself";

export type QuickPlayDuration = 3 | 5 | 10 | 15 | 20 | 30 | "keep-playing";

export interface RelaxMoodDefinition {
  id: RelaxMoodId;
  label: string;
  chakraId: ChakraId;
  description: string;
  icon: string;
  color: string;
  explanation: string;
  supportText: string;
}

export interface QuickHistoryEntry {
  id: string;
  type: "quick";
  chakraId: ChakraId;
  chakraName: string;
  moodId?: RelaxMoodId;
  moodLabel?: string;
  durationLabel: string;
  listenedMinutes: number;
  completedAt: string;
}

export interface AppPreferences {
  lastSelectedDuration: QuickPlayDuration;
  favouriteMoodIds: RelaxMoodId[];
  favouriteChakraIds: ChakraId[];
  quickHistory: QuickHistoryEntry[];
  lastPlayed?: {
    chakraId: ChakraId;
    chakraName: string;
    moodId?: RelaxMoodId;
    moodLabel?: string;
    duration: QuickPlayDuration;
    completedAt: string;
  } | null;
}
