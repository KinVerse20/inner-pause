import type { ProviderSet } from "@/lib/providers/types";

export function getProviderSet(): ProviderSet {
  throw new Error("The provider abstraction is unused. Auth and data go through the MongoDB API.");
}

export type {
  AuthProvider,
  ConfigProvider,
  DatabaseProvider,
  InfrastructureProvider,
  JobProvider,
  ProviderSet,
  ProviderSession,
  ProviderUser,
  StorageProvider,
} from "@/lib/providers/types";
