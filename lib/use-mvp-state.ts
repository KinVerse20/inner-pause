"use client";

import { useSyncExternalStore } from "react";

import { defaultMvpState, readMvpState, subscribeMvpState } from "@/lib/mvp-storage";

export function useMvpState() {
  return useSyncExternalStore(subscribeMvpState, readMvpState, () => defaultMvpState);
}
