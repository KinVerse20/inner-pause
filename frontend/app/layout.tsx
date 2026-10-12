import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { PlayerProvider } from "@/components/player-provider";
import { PwaRegistration } from "@/components/pwa-registration";
import { AccountInvitationGate } from "@/components/account-invitation-gate";
import { AuthSessionSync } from "@/components/auth-session-sync";
import { EntryGate } from "@/components/entry-gate";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeApplier } from "@/components/theme-applier";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Approved typeface per docs/BRAND_IDENTITY.md §5 — additive alongside the
// existing Geist variable so not-yet-rebuilt screens are unaffected. Used
// via --ds-font-sans (app/globals.css) by the new design-system screens.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://theinnerpause.app"),
  title: "The Inner Pause",
  applicationName: "The Inner Pause",
  description: "Guided reflective expression, emotional insight and personalised reset sessions.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "The Inner Pause",
    description: "A daily ritual for release, reflection and renewal.",
    images: ["/branding/innerpause-logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Inner Pause",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1b4c" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-[var(--ds-bg)] text-[var(--ds-text)]">
        <div className="ds-grain" aria-hidden="true" />
        <PlayerProvider>
          <SmoothScroll>
            <AuthSessionSync />
            <EntryGate />
            <ThemeApplier />
            {children}
            <AccountInvitationGate />
            <PwaRegistration />
          </SmoothScroll>
        </PlayerProvider>
      </body>
    </html>
  );
}
