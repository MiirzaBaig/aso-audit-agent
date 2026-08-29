"use client";

import { useState } from "react";
import type { AppIdentity } from "@aso/shared";
import { startAudit, resumeAudit, type AuditResult } from "@/lib/api";
import { ThemeToggle, ThemeScript } from "@/components/ThemeToggle";
import { UrlComposer } from "@/components/UrlComposer";
import { ConfirmCard } from "@/components/ConfirmCard";
import { AuditingSkeleton } from "@/components/AuditingSkeleton";
import { ReportView } from "@/components/ReportView";
import { ExportBar } from "@/components/ExportBar";
import { LogoMark } from "@/components/Logo";

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/MiirzaBaig",
    handle: "@MiirzaBaig",
    icon: "github",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mirza-baig-590b1826b/",
    handle: "Mirza Baig",
    icon: "linkedin",
  },
] as const;

type Phase =
  | { step: "idle" }
  | { step: "resolving" }
  | { step: "confirming"; runId: string; identity: AppIdentity; deepScan: boolean }
  | { step: "auditing"; identity: AppIdentity; deepScan: boolean }
  | { step: "done"; identity: AppIdentity; result: AuditResult };

export default function Home() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);

  const busy = phase.step === "resolving";

  async function handleStart(url: string, deepScan = false) {
    setError(null);
    setPhase({ step: "resolving" });
    try {
      const res = await startAudit(url, deepScan);
      setPhase({ step: "confirming", runId: res.runId, identity: res.identity, deepScan });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase({ step: "idle" });
    }
  }

  async function handleConfirm() {
    if (phase.step !== "confirming") return;
    const { runId, identity, deepScan } = phase;
    setPhase({ step: "auditing", identity, deepScan });
    try {
      const result = await resumeAudit(runId, true);
      setPhase({ step: "done", identity, result });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The audit failed.");
      setPhase({ step: "idle" });
    }
  }

  function reset() {
    setError(null);
    setPhase({ step: "idle" });
  }

  const showHero = phase.step === "idle" || phase.step === "resolving";

  return (
    <>
      <ThemeScript />
      <main>
        <header className="topbar" data-noprint>
          <button className="brand" onClick={reset} aria-label="ASO Audit home">
            <span className="mark" aria-hidden>
              <LogoMark size={26} />
            </span>
            <span className="wordmark">ASO<span className="thin"> audit</span></span>
          </button>
          <div className="topright">
            <a
              className="ghost-link"
              href="https://mastra.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built with Mastra ↗
            </a>
            <ThemeToggle />
          </div>
        </header>

        <div className="stage">
          {showHero && (
            <section className="hero">
              <span className="label reveal" style={{ ["--i" as string]: 0 }}>
                App Store Optimization
              </span>
              <h1 className="reveal" style={{ ["--i" as string]: 1 }}>
                Score your App Store
                <br />
                listing in <span className="hl">20 seconds</span>.
              </h1>
              <p className="sub reveal" style={{ ["--i" as string]: 2 }}>
                Paste a listing. Every score is computed straight from Apple&apos;s public
                data — not guessed by a model. You get a graded card and a ranked plan with
                real before / after rewrites.
              </p>
              <div className="reveal composer-wrap" style={{ ["--i" as string]: 3 }}>
                <UrlComposer onSubmit={handleStart} busy={busy} error={error} />
              </div>
              <div className="reveal proof" style={{ ["--i" as string]: 4 }}>
                <Stat k="10" v="dimensions scored" />
                <Divider />
                <Stat k="100" v="point scale" />
                <Divider />
                <Stat k="0" v="numbers guessed" />
              </div>
            </section>
          )}

          {phase.step === "confirming" && (
            <div className="flow">
              <ConfirmCard
                identity={phase.identity}
                onConfirm={handleConfirm}
                onReject={reset}
                busy={false}
              />
            </div>
          )}

          {phase.step === "auditing" && (
            <div className="flow wide">
              <AuditingSkeleton identity={phase.identity} deepScan={phase.deepScan} />
            </div>
          )}

          {phase.step === "done" && (
            <div className="flow wide">
              <div className="result-bar" data-noprint>
                <button className="again" onClick={reset}>
                  ← Audit another app
                </button>
                <ExportBar identity={phase.identity} result={phase.result} />
              </div>
              <ReportView identity={phase.identity} result={phase.result} />
            </div>
          )}
        </div>

        <footer className="foot" data-noprint>
          <span className="label">agents · tools · suspend/resume workflow · skill</span>
          <div className="foot-socials">
            <span>Built by Mirza Baig</span>
            {SOCIALS.map((s) => (
              <SocialLink key={s.label} social={s} compact />
            ))}
          </div>
        </footer>
      </main>

      <style jsx>{`
        main {
          position: relative;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          max-width: var(--maxw);
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--line);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: none;
          border: none;
          padding: 0;
        }
        .mark {
          display: inline-flex;
          transition: transform 0.35s var(--ease);
        }
        .brand:hover .mark { transform: scale(1.08) rotate(-8deg); }
        .wordmark {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.05rem;
          letter-spacing: -0.04em;
          color: var(--ink);
        }
        .thin { color: var(--ink-3); font-weight: 400; }
        .topright {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .ghost-link {
          font-size: 0.82rem;
          color: var(--ink-3);
          transition: color 0.15s;
        }
        .ghost-link:hover { color: var(--ink); }
        .stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 0 4rem;
        }
        .hero {
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          max-width: 660px;
          align-items: flex-start;
        }
        h1 {
          font-size: clamp(2.4rem, 6.5vw, 4rem);
          line-height: 1.02;
          font-weight: 600;
        }
        .hl { color: var(--accent); }
        .sub {
          font-size: 1.08rem;
          color: var(--ink-2);
          line-height: 1.6;
          max-width: 54ch;
          margin: 0;
        }
        .composer-wrap { width: 100%; max-width: 620px; }
        .proof {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .flow {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .flow.wide { max-width: var(--maxw); }
        .result-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .again {
          align-self: flex-start;
          background: none;
          border: none;
          color: var(--ink-3);
          font-size: 0.88rem;
          padding: 0.3rem 0;
          transition: color 0.15s, transform 0.15s;
        }
        .again:hover { color: var(--accent); transform: translateX(-3px); }
        .foot {
          padding: 1.75rem 0;
          border-top: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .foot-socials {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          color: var(--ink-3);
          font-size: 0.82rem;
        }
        @media (max-width: 700px) {
          main { padding: 0 1.15rem; }
          .stage { padding: 1.5rem 0 3rem; }
          .hero { gap: 1.15rem; }
          .sub { font-size: 0.98rem; }
          .result-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
        }
        @media (max-width: 560px) {
          main { padding: 0 1rem; }
          .proof { gap: 1.15rem 1.4rem; flex-wrap: wrap; }
          .topbar { align-items: center; }
          .topright { gap: 0.6rem; }
          .ghost-link { display: none; }
          .foot {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.9rem;
          }
          h1 { font-size: clamp(2rem, 9vw, 2.6rem); }
        }
      `}</style>
    </>
  );
}

function SocialLink({
  social,
  compact = false,
}: {
  social: (typeof SOCIALS)[number];
  compact?: boolean;
}) {
  return (
    <a
      className={`social ${compact ? "compact" : ""}`}
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${social.label}: ${social.handle}`}
    >
      <SocialIcon name={social.icon} />
      {!compact && <span>{social.label}</span>}
      <style jsx>{`
        .social {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.42rem 0.72rem;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--surface);
          color: var(--ink-2);
          font-size: 0.78rem;
          font-weight: 600;
          box-shadow: var(--shadow-1);
          transition: color 0.15s, border-color 0.15s, background 0.15s,
            transform 0.15s var(--ease), box-shadow 0.15s;
        }
        .social:hover {
          color: var(--accent);
          border-color: color-mix(in srgb, var(--accent) 40%, var(--line-2));
          background: var(--accent-wash);
          box-shadow: var(--shadow-2);
          transform: translateY(-1px);
        }
        .social:active {
          transform: translateY(0);
        }
        .compact {
          width: 34px;
          height: 34px;
          min-height: 34px;
          padding: 0;
        }
      `}</style>
    </a>
  );
}

function SocialIcon({ name }: { name: (typeof SOCIALS)[number]["icon"] }) {
  if (name === "github") {
    return (
      <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 .3C5.37.3 0 5.67 0 12.3c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.3C24 5.67 18.63.3 12 .3Z" />
        <style jsx>{`
          .social-icon {
            width: 16px;
            height: 16px;
            display: block;
            flex: none;
          }
        `}</style>
      </svg>
    );
  }

  return (
    <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
      <style jsx>{`
        .social-icon {
          width: 16px;
          height: 16px;
          display: block;
          flex: none;
        }
      `}</style>
    </svg>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <span className="k mono">{k}</span>
      <span className="v">{v}</span>
      <style jsx>{`
        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .k {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--ink);
          line-height: 1;
        }
        .v {
          font-size: 0.76rem;
          color: var(--ink-3);
        }
      `}</style>
    </div>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      style={{ width: 1, height: 30, background: "var(--line-2)", flex: "none" }}
    />
  );
}
