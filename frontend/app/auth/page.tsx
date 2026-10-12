import { Suspense } from "react";

import { AuthScreen } from "@/components/auth-screen";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthScreen />
    </Suspense>
  );
}
