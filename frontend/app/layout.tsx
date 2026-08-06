import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono } from "next/font/google";
import { PlayerProvider } from "@/components/player-provider";
import { PwaRegistration } from "@/components/pwa-registration";
import { AuthProvider } from "@/lib/auth/auth-provider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://theinnerpause.app"),
  title: "The InnerPause",
  applicationName: "The InnerPause",
  description: "Guided reflective expression, emotional insight and personalised reset sessions.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "The InnerPause",
    description: "A daily ritual for release, reflection and renewal.",
    images: ["/branding/innerpause-logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The InnerPause",
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
  themeColor: "#17191B",
  colorScheme: "dark",
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
      className={`${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] flex flex-col">
        <PlayerProvider>
          <AuthProvider>
            {children}
            <PwaRegistration />
          </AuthProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
