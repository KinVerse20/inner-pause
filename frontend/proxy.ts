import { NextResponse, type NextRequest } from "next/server";

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
    pathname.startsWith("/api/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request });
  }
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
