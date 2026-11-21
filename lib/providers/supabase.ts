import type {
  AuthProvider,
  DatabaseProvider,
  JobProvider,
  ProviderSet,
  StorageProvider,
} from "@/lib/providers/types";
import { getProviderConfig } from "@/lib/providers/config";

function serverOnlyStub(method: string): never {
  throw new Error(`Provider method "${method}" requires an existing request-specific Supabase client adapter.`);
}

const auth: AuthProvider = {
  async getSession() {
    serverOnlyStub("auth.getSession");
  },
  async signUp() {
    serverOnlyStub("auth.signUp");
  },
  async signIn() {
    serverOnlyStub("auth.signIn");
  },
  async signOut() {
    serverOnlyStub("auth.signOut");
  },
  async resendVerification() {
    serverOnlyStub("auth.resendVerification");
  },
  async sendPasswordReset() {
    serverOnlyStub("auth.sendPasswordReset");
  },
};

const database: DatabaseProvider = {
  async upsertProfile() {
    serverOnlyStub("database.upsertProfile");
  },
  async listJournalEntries() {
    serverOnlyStub("database.listJournalEntries");
  },
  async saveJournalEntry() {
    serverOnlyStub("database.saveJournalEntry");
  },
  async saveHealingPlan() {
    serverOnlyStub("database.saveHealingPlan");
  },
  async saveSessionFeedback() {
    serverOnlyStub("database.saveSessionFeedback");
  },
};

const storage: StorageProvider = {
  async getAudioUrl(pathOrKey) {
    return pathOrKey;
  },
  async getSignedUploadUrl() {
    serverOnlyStub("storage.getSignedUploadUrl");
  },
};

const jobs: JobProvider = {
  async enqueueMorningGuidance() {
    return { jobId: "supabase-local-mock" };
  },
  async enqueueInsightRefresh() {
    return { jobId: "supabase-local-mock" };
  },
};

export function createSupabaseProviderSet(): ProviderSet {
  return {
    auth,
    database,
    storage,
    jobs,
    config: getProviderConfig(),
  };
}

