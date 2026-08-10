"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FrontendCognitoAuthService } from "@/lib/auth/cognito-service";
import {
  clearFrontendSession,
  createFrontendApiClient,
  getRefreshToken,
  isFrontendSessionExpired,
  readFrontendProfile,
  setFrontendSession,
  type FrontendSessionProfile,
} from "@/lib/auth/session";

interface AuthContextValue {
  profile: FrontendSessionProfile | null;
  loading: boolean;
  signUp(input: { email: string; password: string; fullName?: string }): Promise<void>;
  confirmSignUp(input: { email: string; code: string }): Promise<void>;
  signIn(input: { email: string; password: string; fullName?: string }): Promise<void>;
  signOut(): void;
  forgotPassword(email: string): Promise<void>;
  confirmForgotPassword(input: { email: string; code: string; password: string }): Promise<void>;
  resendVerification(email: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<FrontendSessionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const serviceRef = useRef<FrontendCognitoAuthService | null>(null);
  const getService = () => {
    serviceRef.current ??= new FrontendCognitoAuthService();
    return serviceRef.current;
  };

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const existing = readFrontendProfile();
        if (!existing) return;

        const refreshToken = getRefreshToken();
        if (refreshToken && isFrontendSessionExpired()) {
          const refreshed = await getService().refresh(refreshToken);
          setFrontendSession(refreshed.accessToken, existing, { ...refreshed, refreshToken });
        }
        const api = createFrontendApiClient(() => {
          clearFrontendSession();
          setProfile(null);
        });
        const user = await api.me();
        if (active && user) {
          setFrontendSession(localStorage.getItem("innerpause-aws-access-token") ?? "", user, {
            idToken: localStorage.getItem("innerpause-aws-id-token") ?? undefined,
            refreshToken: localStorage.getItem("innerpause-aws-refresh-token") ?? undefined,
            expiresAt: Number(localStorage.getItem("innerpause-aws-token-expires-at") ?? "0") || Date.now() + 3600_000,
          });
          setProfile(user);
        }
      } catch {
        clearFrontendSession();
        if (active) setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || profile || isPublicPath(pathname)) return;
    router.replace(`/auth?redirectTo=${encodeURIComponent(pathname)}`);
  }, [loading, pathname, profile, router]);

  const value: AuthContextValue = {
    profile,
    loading,
    async signUp(input) {
      await getService().signUp(input);
    },
    async confirmSignUp(input) {
      await getService().confirmSignUp(input);
    },
    async signIn(input) {
      const session = await getService().signIn(input);
      const temporaryProfile = { id: session.email, email: session.email, fullName: session.fullName };
      setFrontendSession(session.accessToken, temporaryProfile, session);
      const api = createFrontendApiClient(() => {
        clearFrontendSession();
        setProfile(null);
      });
      const persistedProfile = await api.session();
      setFrontendSession(session.accessToken, persistedProfile, session);
      setProfile(persistedProfile);
    },
    signOut() {
      clearFrontendSession();
      setProfile(null);
    },
    forgotPassword(email) {
      return getService().forgotPassword(email);
    },
    confirmForgotPassword(input) {
      return getService().confirmForgotPassword(input);
    },
    resendVerification(email) {
      return getService().resendVerification(email);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function isPublicPath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/") || pathname === "/about" || pathname === "/onboarding" || pathname === "/offline";
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
