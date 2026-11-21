import { SessionSetupScreen } from "@/components/session-setup-screen";
import { ChakraId } from "@/lib/types";

export default async function SessionSetupPage({
  params,
}: {
  params: Promise<{ chakraId: ChakraId; sessionId: string }>;
}) {
  const { chakraId, sessionId } = await params;
  return <SessionSetupScreen chakraId={chakraId} sessionId={sessionId} />;
}
