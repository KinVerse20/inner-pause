import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// The locked product rule is "no mandatory signup before first value" —
// not just locally (where these env vars are empty and this whole file
// no-ops below), but structurally, so a future deploy with real Supabase
// keys doesn't silently reinstate a sign-in wall across the entire app.
// Every route the core product actually uses (Home, Pause, Practice,
// Journey, You, Moments, Tell, Entry) has to stay public; only
// genuinely remote-only actions (Pass, Calendar, Gift a Pause —
// docs/TECHNICAL_ARCHITECTURE.md §12.6) are meant to ever require auth,
// and none of those are implemented against real Supabase yet either.
const publicRoutes = [
  "/",
  "/entry",
  "/pause",
  "/practice",
  "/journey",
  "/profile",
  "/moments",
  "/tell",
  "/auth",
  "/auth/confirm",
  "/auth/reset-password",
  "/about",
  "/offline",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
];

function isPublicPath(pathname: string) {
  return (
    publicRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/branding/") ||
    pathname.startsWith("/audio/") ||
    pathname.startsWith("/api/analyze") ||
    pathname.startsWith("/api/profile/signup") ||
    pathname.startsWith("/api/tell-interpret")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/auth" && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicPath(pathname)) {
    return response;
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("redirectTo", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
