import type { ConfigProvider, InfrastructureProvider } from "@/lib/providers/types";

const allowedProviders: InfrastructureProvider[] = ["supabase", "aws"];

export function getInfrastructureProvider(): InfrastructureProvider {
  const raw = process.env.INFRASTRUCTURE_PROVIDER?.trim().toLowerCase();
  if (!raw) return "supabase";
  if (allowedProviders.includes(raw as InfrastructureProvider)) return raw as InfrastructureProvider;
  throw new Error(`Unsupported INFRASTRUCTURE_PROVIDER "${raw}". Use "supabase" or "aws".`);
}

export function getProviderConfig(): ConfigProvider {
  const provider = getInfrastructureProvider();
  return {
    provider,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    isAwsTestMode: provider === "aws",
  };
}

