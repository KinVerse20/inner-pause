import { getInfrastructureProvider } from "@/lib/providers/config";
import { createAwsProviderSet } from "@/lib/providers/aws";
import { createSupabaseProviderSet } from "@/lib/providers/supabase";
import type { ProviderSet } from "@/lib/providers/types";

export function getProviderSet(): ProviderSet {
  const provider = getInfrastructureProvider();
  return provider === "aws" ? createAwsProviderSet() : createSupabaseProviderSet();
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

