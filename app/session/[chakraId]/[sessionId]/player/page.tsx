import { SessionPlayerScreen } from "@/components/session-player-screen";
import { ChakraId } from "@/lib/types";

export default async function SessionPlayerPage({
  params,
}: {
  params: Promise<{ chakraId: ChakraId; sessionId: string }>;
}) {
  const { chakraId, sessionId } = await params;
  return <SessionPlayerScreen chakraId={chakraId} sessionId={sessionId} />;
}
