"use client";

import { useState } from "react";
import type { AppIdentity } from "@aso/shared";
import { startAudit, resumeAudit, type AuditResult } from "@/lib/api";
import { ThemeToggle, ThemeScript } from "@/components/ThemeToggle";
import { UrlComposer } from "@/components/UrlComposer";
import { ConfirmCard } from "@/components/ConfirmCard";
import { ProgressLog } from "@/components/ProgressLog";
import { ReportView } from "@/components/ReportView";

type Phase =
  | { step: "idle" }
  | { step: "resolving" }
  | { step: "confirming"; runId: string; identity: AppIdentity }
  | { step: "auditing"; identity: AppIdentity }
  | { step: "done"; identity: AppIdentity; result: AuditResult };

export default function Home() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);

  const busy = phase.step === "resolving" || phase.step === "auditing";

  async function handleStart(url: string) {
    setError(null);
    setPhase({ step: "resolving" });
    try {
      const res = await startAudit(url);
      setPhase({ step: "confirming", runId: res.runId, identity: res.identity });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase({ step: "idle" });
    }
  }

  async function handleConfirm() {
    if (phase.step !== "confirming") return;
    const { runId, identity } = phase;
    setPhase({ step: "auditing", identity });
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
        <header className="topbar">
          <button className="brand" onClick={reset} aria-label="ASO Audit home">
            <span className="glyph" aria-hidden>◎</span>
            <span className="wordmark">ASO<span className="dot">.</span>audit</span>
          </button>
          <ThemeToggle />
        </header>

        <div className="stage">
          {showHero && (
            <section className="hero">
              <span className="kicker eyebrow">App Store Optimization · listing X-ray</span>
              <h1>
                Paste a listing.
                <br />
                Get the <span className="grad">audit it deserves</span>.
              </h1>
              <p className="sub">
                Every score is <strong>computed from Apple&apos;s public data</strong>, not
                guessed by a model. You get a graded scorecard and a prioritized plan with
                real before/after rewrites.
              </p>
              <UrlComposer onSubmit={handleStart} busy={busy} error={error} />
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
            <div className="flow">
              <Confirmed identity={phase.identity} />
              <ProgressLog />
            </div>
          )}

          {phase.step === "done" && (
            <div className="flow wide">
              <div className="result-head">
                <button className="again" onClick={reset}>← Audit another app</button>
              </div>
              <ReportView identity={phase.identity} result={phase.result} />
            </div>
          )}
        </div>

        <footer className="foot">
          <span>Built with Mastra · agents, tools, a suspend/resume workflow &amp; a skill</span>
        </footer>
      </main>

      <style jsx>{`
        main {
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          max-width: var(--maxw);
          margin: 0 auto;
          padding: 0 1.25rem;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          background: none;
          border: none;
          padding: 0;
        }
        .glyph {
          color: var(--accent);
          font-size: 1.4rem;
        }
        .wordmark {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.03em;
          color: var(--ink);
        }
        .dot { color: var(--accent); }
        .stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem 0 4rem;
        }
        .hero {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          max-width: 640px;
          margin: 0 auto;
          text-align: center;
          align-items: center;
        }
        .kicker { margin-bottom: 0.25rem; }
        h1 {
          font-size: clamp(2.2rem, 6vw, 3.4rem);
          line-height: 1.04;
          font-weight: 800;
        }
        .grad {
          background: linear-gradient(100deg, var(--accent), var(--accent-strong));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .sub {
          font-size: 1.02rem;
          color: var(--ink-2);
          line-height: 1.6;
          max-width: 52ch;
          margin: 0 0 0.5rem;
        }
        .sub strong { color: var(--ink); font-weight: 600; }
        .flow {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .flow.wide {
          max-width: var(--maxw);
        }
        .result-head {
          display: flex;
        }
        .again {
          background: none;
          border: none;
          color: var(--ink-3);
          font-size: 0.88rem;
          padding: 0.3rem 0;
          transition: color 0.12s;
        }
        .again:hover { color: var(--accent); }
        .foot {
          padding: 1.5rem 0 2rem;
          text-align: center;
          font-size: 0.78rem;
          color: var(--ink-faint);
          border-top: 1px solid var(--border);
        }
        @media (max-width: 520px) {
          .stage { padding: 1rem 0 3rem; }
        }
      `}</style>
    </>
  );
}

/** Small confirmed-app strip shown above the progress log. */
function Confirmed({ identity }: { identity: AppIdentity }) {
  return (
    <div className="confirmed">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={identity.iconUrl} alt="" width={40} height={40} className="ic" />
      <div>
        <strong>{identity.name}</strong>
        <span>{identity.developer}</span>
      </div>
      <span className="ok mono">confirmed</span>
      <style jsx>{`
        .confirmed {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.75rem 1rem;
          box-shadow: var(--shadow-sm);
        }
        .confirmed div {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        strong { font-size: 0.95rem; }
        span { font-size: 0.8rem; color: var(--ink-3); }
        .ok {
          margin-left: auto;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--good);
          background: var(--good-soft);
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
        }
        .ic { width: 40px; height: 40px; }
      `}</style>
    </div>
  );
}
