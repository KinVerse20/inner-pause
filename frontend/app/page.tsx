import { MvpHomeScreen } from "@/components/mvp-home-screen";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <MvpHomeScreen />
    </Suspense>
  );
}
