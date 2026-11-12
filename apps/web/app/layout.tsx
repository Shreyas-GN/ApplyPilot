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
  metadataBase: new URL("https://applypilot.app"),
  title: {
    default: "ApplyPilot — Your next opportunity deserves a better approach.",
    template: "%s | ApplyPilot",
  },
  description:
    "Understand your strengths. Find opportunities that fit. Build an application that reflects your best work. A personal career intelligence platform.",
  keywords: [
    "career intelligence platform",
    "job search workspace",
    "adaptive resume",
    "opportunity matching",
    "application tracker",
    "ApplyPilot",
  ],
  authors: [{ name: "ApplyPilot" }],
  creator: "ApplyPilot",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://applypilot.app",
    title: "ApplyPilot — Your next opportunity deserves a better approach.",
    description:
      "Understand your strengths. Find opportunities that fit. Build an application that reflects your best work.",
    siteName: "ApplyPilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyPilot — Your next opportunity deserves a better approach.",
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
