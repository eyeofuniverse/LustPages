import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { AgeGate } from "@/components/layout/AgeGate";
import { auth } from "@/auth";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { AnalyticsEvents } from "@/components/analytics/AnalyticsEvents";
import { PageTracker } from "@/components/analytics/PageTracker";
import { Suspense } from "react";
import { Analytics } from '@vercel/analytics/next';

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LustPages — Adult Fiction & Erotica Stories",
    template: "%s | LustPages",
  },
  description:
    "Discover thousands of premium adult fiction stories. Romance, fantasy, and contemporary erotica written by talented authors. Free to read.",
  keywords: [
    "LustPages", "Lust Pages",
    "erotica", "adult fiction", "romance stories", "erotic literature",
    "adult stories", "sexual fiction", "romantic erotica", "fantasy erotica",
  ],
  authors: [{ name: "LustPages" }],
  creator: "LustPages",
  publisher: "LustPages",
  icons: {
    shortcut: "/favicon.ico",
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LustPages",
    title: "LustPages — Adult Fiction & Erotica Stories",
    description:
      "Discover thousands of premium adult fiction stories. Romance, fantasy, and contemporary erotica written by talented authors.",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "LustPages — Adult Fiction",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LustPages — Adult Fiction & Erotica Stories",
    description: "Premium adult fiction and erotica stories.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
  other: {
    "rating": "adult",
    "6a97888e-site-verification": "cdc7c166f46872bfb7973391f6a55e85",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <AnalyticsEvents />
        </Suspense>
        <PageTracker />
        <SessionProvider session={session}>
          <AgeGate />
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
