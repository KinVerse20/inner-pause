import { ChakraId, MoodValue } from "@/lib/types";

export type SaveMode =
  | "journal_and_analysis"
  | "reset_only"
  | "journal_without_analysis"
  | "temporary_analysis";

export type EmotionLevel = "low" | "medium" | "high";

export interface AnalysisIncident {
  id: string;
  text: string;
}

export interface EmotionalAnalysis {
  summary: string;
  originalEntrySummary?: string;
  understandingSummary?: string;
  keyIncidents: AnalysisIncident[];
  emotions: Array<{
    name: string;
    intensity: number;
    level: EmotionLevel;
    explanation?: string;
    evidence?: string;
  }>;
  triggers: string[];
  chakraAssociations: Array<{
    chakra: ChakraId;
    emotionalTheme?: string;
    reason: string;
    sessionSupport?: string;
    confidence: number;
  }>;
  healingApproachSummary?: string;
  suggestedOutcome: string;
  recommendedDuration: number;
  safetyFlag: boolean;
  analysisSource?: "openai" | "fallback";
}

export interface JournalEntry {
  id: string;
  title: string;
  rawText: string;
  transcription?: string;
  saveMode: SaveMode;
  isTemporary: boolean;
  emotionalIntensityBefore: number;
  createdAt: string;
  updatedAt: string;
  analysis?: EmotionalAnalysis;
  plan?: HealingPlan;
  feedback?: SessionFeedback;
  favourite?: boolean;
}

export interface HealingPlanBlock {
  id: string;
  chakraId: ChakraId;
  type: "intro" | "chakra" | "guidance" | "affirmation" | "closing";
  title: string;
  intention: string;
  durationMinutes: number;
  audioPath: string;
  frequencyLabel: string;
  guidanceText?: string;
}

export type VoiceGuidanceLevel = "none" | "minimal" | "balanced" | "guided";
export type MusicStyle = "ambient" | "singing-bowls" | "nature-soundscape" | "deep-frequency" | "soft-meditation";
export type NatureSound = "none" | "rain" | "forest" | "ocean" | "soft-wind";
export type GuidanceFrequency = "opening-only" | "occasional" | "regular";

export interface HealingPlanCustomisation {
  duration: number | "full";
  voiceGuidanceLevel: VoiceGuidanceLevel;
  musicStyle: MusicStyle;
  affirmationsEnabled: boolean;
  natureSound: NatureSound;
  guidanceFrequency: GuidanceFrequency;
}

export interface HealingPlan {
  id: string;
  journalEntryId: string;
  title: string;
  intendedOutcome: string;
  totalDurationMinutes: number;
  selectedDuration: number | "full";
  customisation?: HealingPlanCustomisation;
  blocks: HealingPlanBlock[];
  createdAt: string;
  status: "draft" | "started" | "completed";
  lastPlaybackPosition: {
    blockIndex: number;
    elapsedSeconds: number;
  };
}

export interface SessionFeedback {
  emotionalIntensityAfter: number;
  bodyTensionAfter: number;
  mentalCalmnessAfter: number;
  helpfulSection: string;
  uncomfortable?: string;
  wouldRepeat: boolean;
  reflection?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  label: string;
  time: string;
  days: string;
  enabled: boolean;
}

export interface HealingProfile {
  fullName: string;
  email: string;
  phone: string;
  onboardingCompleted: boolean;
  concerns: string[];
  dailyGoal: string;
  onboardingMood?: MoodValue;
  preferredSessionDuration: number;
  preferredVoice: string;
  preferredMusicStyle: string;
  preferredGuidanceLevel: string;
  affirmationsEnabled: boolean;
  natureSoundsEnabled: boolean;
  aiMemoryEnabled: boolean;
  morningGuidanceEnabled: boolean;
  guidanceTime: string;
  reminders: Reminder[];
}

export interface MvpState {
  profile: HealingProfile;
  entries: JournalEntry[];
  activePlanId: string | null;
  premiumOfferSeen: boolean;
  morningGuidanceMessages: Array<{
    id: string;
    messageText: string;
    scheduledFor: string;
    deliveryChannel: "mock" | "meta_whatsapp" | "twilio";
    deliveryStatus: "mock_created" | "paused" | "disabled";
    createdAt: string;
  }>;
}
