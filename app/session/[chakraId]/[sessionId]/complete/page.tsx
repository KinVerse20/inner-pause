import { SessionCompletionScreen } from "@/components/session-completion-screen";
import { ChakraId } from "@/lib/types";

export default async function SessionCompletePage({
  params,
}: {
  params: Promise<{ chakraId: ChakraId; sessionId: string }>;
}) {
  const { chakraId, sessionId } = await params;
  return <SessionCompletionScreen chakraId={chakraId} sessionId={sessionId} />;
}
