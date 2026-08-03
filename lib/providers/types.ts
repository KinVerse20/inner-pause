import type { HealingProfile, JournalEntry, HealingPlan, SessionFeedback } from "@/lib/mvp-types";

export type InfrastructureProvider = "supabase" | "aws";

export interface ProviderUser {
  id: string;
  email?: string;
  fullName?: string;
}

export interface ProviderSession {
  user: ProviderUser;
  accessToken?: string;
  expiresAt?: number;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  redirectTo?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthProvider {
  getSession(): Promise<ProviderSession | null>;
  signUp(input: SignUpInput): Promise<{ user: ProviderUser | null; verificationRequired: boolean }>;
  signIn(input: SignInInput): Promise<ProviderSession>;
  signOut(): Promise<void>;
  resendVerification(email: string): Promise<void>;
  sendPasswordReset(email: string, redirectTo?: string): Promise<void>;
}

export interface DatabaseProvider {
  upsertProfile(userId: string, profile: Partial<HealingProfile>): Promise<void>;
  listJournalEntries(userId: string): Promise<JournalEntry[]>;
  saveJournalEntry(userId: string, entry: JournalEntry): Promise<void>;
  saveHealingPlan(userId: string, plan: HealingPlan): Promise<void>;
  saveSessionFeedback(userId: string, planId: string, feedback: SessionFeedback): Promise<void>;
}

export interface StorageProvider {
  getAudioUrl(pathOrKey: string): Promise<string>;
  getSignedUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; objectUrl: string }>;
}

export interface JobProvider {
  enqueueMorningGuidance(userId: string): Promise<{ jobId: string }>;
  enqueueInsightRefresh(userId: string, journalEntryId: string): Promise<{ jobId: string }>;
}

export interface ConfigProvider {
  provider: InfrastructureProvider;
  appUrl: string;
  isAwsTestMode: boolean;
}

export interface ProviderSet {
  auth: AuthProvider;
  database: DatabaseProvider;
  storage: StorageProvider;
  jobs: JobProvider;
  config: ConfigProvider;
}

