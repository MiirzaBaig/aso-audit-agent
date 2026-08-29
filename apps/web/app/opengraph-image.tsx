import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ASO Audit - score your App Store listing from public Apple data";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0a0b";
const PANEL = "#141416";
const PANEL_2 = "#1d1d21";
const LINE = "#303036";
const INK = "#f6f6f3";
const MUTED = "#a7a7a0";
const FAINT = "#74746d";
const ACCENT = "#7d80ff";
const GOOD = "#4bc484";
const FAIR = "#e0a94e";
const POOR = "#e8746b";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BG,
          color: INK,
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: 54,
          backgroundImage:
            "linear-gradient(#171719 1px, transparent 1px), linear-gradient(90deg, #171719 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            gap: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 610,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Logo />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", fontSize: 31, fontWeight: 700, letterSpacing: 0 }}>
                  ASO <span style={{ color: MUTED, fontWeight: 400 }}>&nbsp;Audit</span>
                </div>
                <div style={{ display: "flex", fontSize: 17, color: FAINT }}>
                  Data-grounded App Store diagnostics
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 74,
                  fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: 0,
                }}
              >
                <span>Score your</span>
                <span>listing from</span>
                <span style={{ color: ACCENT }}>Apple data.</span>
              </div>
              <div style={{ display: "flex", maxWidth: 555, fontSize: 27, lineHeight: 1.36, color: MUTED }}>
                Graded scorecard, review evidence, competitor context, and a ranked action plan.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Badge label="10 dimensions" />
              <Badge label="100 point scale" />
              <Badge label="ranked fixes" />
            </div>
          </div>

          <AuditCard />
        </div>
      </div>
    ),
    size,
  );
}

function Logo() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <rect x="1" y="1" width="66" height="66" rx="17" fill={ACCENT} />
      <path d="M18 43a16 16 0 1 1 32 0" stroke="#0a0a0b" strokeOpacity="0.34" strokeWidth="5" strokeLinecap="round" />
      <path d="M18 43a16 16 0 0 1 27.4-11.2" stroke="#0a0a0b" strokeWidth="5" strokeLinecap="round" />
      <path d="M34 43 42.6 27.8" stroke="#0a0a0b" strokeWidth="5" strokeLinecap="round" />
      <circle cx="34" cy="43" r="4.6" fill="#0a0a0b" />
    </svg>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        border: `1px solid ${LINE}`,
        borderRadius: 999,
        background: PANEL,
        color: MUTED,
        padding: "12px 18px",
        fontSize: 18,
      }}
    >
      {label}
    </div>
  );
}

function AuditCard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 430,
        height: "100%",
        border: `1px solid ${LINE}`,
        borderRadius: 24,
        background: PANEL,
        padding: 28,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", color: FAINT, fontSize: 15 }}>AUDIT REPORT</div>
          <div style={{ display: "flex", color: INK, fontSize: 25, fontWeight: 700 }}>Listing health</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 54,
            height: 54,
            borderRadius: 15,
            background: "#eeeeff",
            color: BG,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          B
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 28 }}>
        <Gauge />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>78</div>
          <div style={{ display: "flex", fontSize: 18, color: MUTED }}>overall score</div>
          <div style={{ display: "flex", fontSize: 16, color: GOOD }}>+22 points available</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Metric label="Title & subtitle" value="8.6" color={GOOD} width={86} />
        <Metric label="Keywords" value="6.2" color={FAIR} width={62} />
        <Metric label="Screenshots" value="4.8" color={POOR} width={48} />
        <Metric label="Reviews" value="7.4" color={FAIR} width={74} />
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "auto",
          borderTop: `1px solid ${LINE}`,
          paddingTop: 20,
          gap: 12,
        }}
      >
        <Fix number="1" label="Quick wins" color={GOOD} />
        <Fix number="4" label="High impact" color={ACCENT} />
      </div>
    </div>
  );
}

function Gauge() {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" fill="none">
      <circle cx="66" cy="66" r={radius} stroke={PANEL_2} strokeWidth="10" />
      <circle
        cx="66"
        cy="66"
        r={radius}
        stroke={GOOD}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.22}
        transform="rotate(-90 66 66)"
      />
      <circle cx="66" cy="66" r="36" fill={BG} />
    </svg>
  );
}

function Metric({
  label,
  value,
  color,
  width,
}: {
  label: string;
  value: string;
  color: string;
  width: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
        <span style={{ color: MUTED }}>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div style={{ display: "flex", height: 7, borderRadius: 999, background: PANEL_2 }}>
        <div style={{ display: "flex", width: `${width}%`, height: "100%", borderRadius: 999, background: color }} />
      </div>
    </div>
  );
}

function Fix({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        gap: 10,
        background: PANEL_2,
        borderRadius: 14,
        padding: "12px 14px",
      }}
    >
      <span style={{ display: "flex", fontSize: 24, fontWeight: 700, color }}>{number}</span>
      <span style={{ display: "flex", fontSize: 16, color: MUTED }}>{label}</span>
    </div>
  );
}
