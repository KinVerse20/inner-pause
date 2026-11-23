import { notFound } from "next/navigation";

import { LocalTestSignIn } from "@/components/local-test-sign-in";

// Dev-only (lib/local-test.ts): absent unless the flag is on, never in production.
export default function LocalTestSignInPage() {
  if (process.env.NEXT_PUBLIC_LOCAL_TEST_AUTH !== "true" || process.env.NODE_ENV === "production") notFound();
  return <LocalTestSignIn />;
}
