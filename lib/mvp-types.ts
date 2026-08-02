import { ChakraId } from "@/lib/types";

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
  keyIncidents: AnalysisIncident[];
  emotions: Array<{
    name: string;
    intensity: number;
    level: EmotionLevel;
    evidence?: string;
  }>;
  triggers: string[];
  chakraAssociations: Array<{
    chakra: ChakraId;
    reason: string;
    confidence: number;
  }>;
  suggestedOutcome: string;
  recommendedDuration: number;
  safetyFlag: boolean;
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
}

export interface HealingPlanBlock {
  id: string;
  chakraId: ChakraId;
  title: string;
  intention: string;
  durationMinutes: number;
  audioPath: string;
  frequencyLabel: string;
}

export interface HealingPlan {
  id: string;
  journalEntryId: string;
  title: string;
  intendedOutcome: string;
  totalDurationMinutes: number;
  selectedDuration: number | "full";
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

export interface HealingProfile {
  fullName: string;
  email: string;
  phone: string;
  onboardingCompleted: boolean;
  preferredSessionDuration: number;
  preferredVoice: string;
  preferredMusicStyle: string;
  preferredGuidanceLevel: string;
  affirmationsEnabled: boolean;
  natureSoundsEnabled: boolean;
  aiMemoryEnabled: boolean;
  morningGuidanceEnabled: boolean;
  guidanceTime: string;
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
