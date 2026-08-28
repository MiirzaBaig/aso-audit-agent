import { ImageResponse } from "next/og";

/**
 * The social preview card (1200×630) shown when the link is shared — in the
 * cold email, Slack, iMessage, X. Rendered at the edge via next/og. Mirrors the
 * product's Swiss look: near-black ground, cobalt accent, the gauge mark, and a
 * confident headline.
 */
export const runtime = "edge";
export const alt = "ASO Audit — score your App Store listing in seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#7d80ff";
const INK = "#f4f4f2";
const SUB = "#9c9c96";
const BG = "#0a0a0b";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: "72px",
          fontFamily: "sans-serif",
          // faint grid, like the app's diagnostic sheet
          backgroundImage:
            "linear-gradient(#1a1a1d 1px, transparent 1px), linear-gradient(90deg, #1a1a1d 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill={ACCENT} />
            <path d="M8 21a8 8 0 1 1 16 0" stroke="#0a0a0b" strokeOpacity="0.35" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M8 21a8 8 0 0 1 13.7-5.6" stroke="#0a0a0b" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M16 21 L20.2 13.4" stroke="#0a0a0b" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="16" cy="21" r="2" fill="#0a0a0b" />
          </svg>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: INK, letterSpacing: -1 }}>
            ASO
            <span style={{ color: SUB, fontWeight: 400 }}>&nbsp;audit</span>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 82,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.02,
              letterSpacing: -3,
              maxWidth: 900,
            }}
          >
            Score your App Store listing in&nbsp;
            <span style={{ color: ACCENT }}>seconds.</span>
          </div>
          <div style={{ fontSize: 30, color: SUB, maxWidth: 820, lineHeight: 1.4 }}>
            Every score computed from Apple&apos;s data — not guessed. Graded card, ranked plan,
            real before/after rewrites.
          </div>
        </div>

        {/* footer stat row */}
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <Stat n="10" l="dimensions" />
          <Bar />
          <Stat n="100" l="point scale" />
          <Bar />
          <Stat n="0" l="numbers guessed" />
          <div style={{ marginLeft: "auto", display: "flex", fontSize: 24, color: SUB }}>
            Built with Mastra
          </div>
        </div>
      </div>
    ),
    size,
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 52, fontWeight: 700, color: INK, letterSpacing: -2 }}>{n}</div>
      <div style={{ fontSize: 22, color: SUB }}>{l}</div>
    </div>
  );
}

function Bar() {
  return <div style={{ width: 1, height: 56, background: "#34343a", display: "flex" }} />;
}
