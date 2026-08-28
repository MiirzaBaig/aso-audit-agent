import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display: Bricolage Grotesque — a characterful, slightly quirky grotesk that
// gives the product a diagnostic-instrument personality without shouting.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

// Body: Inter — clean, humanist, disappears so the data reads.
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

// Data: JetBrains Mono — tabular figures for scores, char counts, ratings.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ASO Audit — App Store listing X-ray",
  description:
    "Paste an App Store URL and get a grounded, prioritized App Store Optimization audit. Scores are computed, not guessed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
