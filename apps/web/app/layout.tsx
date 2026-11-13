import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://applyfocus.app"),
  title: {
    default: "ApplyFocus — AI-powered job search and application intelligence platform.",
    template: "%s | ApplyFocus",
  },
  description:
    "AI-powered job search and application intelligence platform. Understand your strengths. Find opportunities that fit. Build an application that reflects your best work.",
  keywords: [
    "career intelligence platform",
    "job search workspace",
    "adaptive resume",
    "opportunity matching",
    "application tracker",
    "ApplyFocus",
  ],
  authors: [{ name: "ApplyFocus" }],
  creator: "ApplyFocus",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://applyfocus.app",
    title: "ApplyFocus — AI-powered job search and application intelligence platform.",
    description:
      "Understand your strengths. Find opportunities that fit. Build an application that reflects your best work.",
    siteName: "ApplyFocus",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyFocus — AI-powered job search and application intelligence platform.",
    description:
      "Understand your strengths. Find opportunities that fit. Build an application that reflects your best work.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
