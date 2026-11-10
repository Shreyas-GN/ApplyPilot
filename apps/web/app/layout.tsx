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
    default: "ApplyPilot — Find Better Jobs. Apply Smarter.",
    template: "%s | ApplyPilot",
  },
  description:
    "An intentional workspace for candidates. Connect your profile, explore evidence-based job fit, and prepare thoughtful applications with full control.",
  keywords: [
    "job search",
    "career workspace",
    "resume parser",
    "job matching",
    "ATS application",
    "career copilot",
  ],
  authors: [{ name: "ApplyPilot" }],
  creator: "ApplyPilot",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://applypilot.app",
    title: "ApplyPilot — Find Better Jobs. Apply Smarter.",
    description:
      "An intentional workspace for candidates. Connect your profile, explore evidence-based job fit, and prepare thoughtful applications with full control.",
    siteName: "ApplyPilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyPilot — Find Better Jobs. Apply Smarter.",
    description:
      "An intentional workspace for candidates. Connect your profile, explore evidence-based job fit, and prepare thoughtful applications with full control.",
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
