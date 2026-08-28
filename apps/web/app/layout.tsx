import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Geist — a precise, modern grotesk (the register Vercel/Linear ship in).
// Used for both display and body to keep the system tight; weight does the work.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});
const geistBody = Geist({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500"],
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ASO Audit — score your App Store listing",
  description:
    "Paste an App Store URL and get a grounded App Store Optimization audit in seconds. Scores are computed from Apple's data, not guessed.",
  applicationName: "ASO Audit",
  openGraph: {
    title: "ASO Audit — score your App Store listing in seconds",
    description:
      "Every score computed from Apple's data, not guessed. Graded card, ranked plan, real before/after rewrites.",
    type: "website",
    siteName: "ASO Audit",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASO Audit — score your App Store listing in seconds",
    description:
      "Every score computed from Apple's data, not guessed. Graded card, ranked plan, real before/after rewrites.",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistBody.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
