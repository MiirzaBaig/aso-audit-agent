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
          text-align: center;
          border-top: 1px solid var(--line);
        }
        @media (max-width: 560px) {
          .proof { flex-wrap: wrap; gap: 1rem; }
          .stage { padding: 1.5rem 0 3rem; }
        }
      `}</style>
    </>
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
