import type {
  AuthProvider,
  DatabaseProvider,
  JobProvider,
  ProviderSet,
  StorageProvider,
} from "@/lib/providers/types";
import { getProviderConfig } from "@/lib/providers/config";

function awsTestStub(method: string): never {
  throw new Error(
    `AWS provider method "${method}" is scaffolded for the isolated test environment but is not active in the current Next.js UI yet.`,
  );
}

const auth: AuthProvider = {
  async getSession() {
    awsTestStub("auth.getSession");
  },
  async signUp() {
    awsTestStub("auth.signUp");
  },
  async signIn() {
    awsTestStub("auth.signIn");
  },
  async signOut() {
    awsTestStub("auth.signOut");
  },
  async resendVerification() {
    awsTestStub("auth.resendVerification");
  },
  async sendPasswordReset() {
    awsTestStub("auth.sendPasswordReset");
  },
};

const database: DatabaseProvider = {
  async upsertProfile() {
    awsTestStub("database.upsertProfile");
  },
  async listJournalEntries() {
    awsTestStub("database.listJournalEntries");
  },
  async saveJournalEntry() {
    awsTestStub("database.saveJournalEntry");
  },
  async saveHealingPlan() {
    awsTestStub("database.saveHealingPlan");
  },
  async saveSessionFeedback() {
    awsTestStub("database.saveSessionFeedback");
  },
};

const storage: StorageProvider = {
  async getAudioUrl(pathOrKey) {
    if (pathOrKey.startsWith("/audio/")) return pathOrKey;
    awsTestStub("storage.getAudioUrl");
  },
  async getSignedUploadUrl() {
    awsTestStub("storage.getSignedUploadUrl");
  },
};

const jobs: JobProvider = {
  async enqueueMorningGuidance() {
    awsTestStub("jobs.enqueueMorningGuidance");
  },
  async enqueueInsightRefresh() {
    awsTestStub("jobs.enqueueInsightRefresh");
  },
};

export function createAwsProviderSet(): ProviderSet {
  return {
    auth,
    database,
    storage,
    jobs,
    config: getProviderConfig(),
  };
}

