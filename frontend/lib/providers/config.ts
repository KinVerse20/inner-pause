import type { ConfigProvider, InfrastructureProvider } from "@/lib/providers/types";

export function getInfrastructureProvider(): InfrastructureProvider {
  return "mongodb";
}

export function getProviderConfig(): ConfigProvider {
  return {
    provider: "mongodb",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    isAwsTestMode: false,
  };
}
