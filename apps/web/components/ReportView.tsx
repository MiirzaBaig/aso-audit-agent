"use client";

import type { AppIdentity } from "@aso/shared";
import type { AuditResult } from "@/lib/api";
import { ScoreGauge } from "./ScoreGauge";
import { DimensionBars } from "./DimensionBars";
import { Recommendations } from "./Recommendations";
import { CompetitorTable } from "./CompetitorTable";

/**
 * The full audit, unfurled as a diagnostic dashboard: score gauge + dimension
 * breakdown up top, then the tiered action plan, competitor comparison, and an
 * honest limitations note.
 */
export function ReportView({
  identity,
  result,
}: {
  identity: AppIdentity;
  result: AuditResult;
}) {
  const { report, analysisSource } = result;

  return (
    <div className="report">
      <div className="hero">
        <div className="hero-left">
          <span className="eyebrow">ASO Score Card</span>
          <h2 className="headline">{report.headline}</h2>
          <span className={`source ${analysisSource}`}>
            {analysisSource === "llm"
              ? "Action plan written by the NIM analyst · scores computed deterministically"
              : "Action plan generated deterministically (no LLM key set) · scores computed deterministically"}
          </span>
        </div>
        <div className="hero-right">
          <ScoreGauge overall={report.scoreCard.overall} grade={report.scoreCard.grade} />
        </div>
      </div>

      <Panel title="Dimension breakdown" hint="Tap a row for the evidence behind each score">
        <DimensionBars dimensions={report.scoreCard.dimensions} />
      </Panel>

      <section className="plan">
        <div className="section-head">
          <span className="eyebrow">Prioritized action plan</span>
          <h3>What to change, in order of leverage</h3>
        </div>
        <Recommendations recommendations={report.recommendations} />
      </section>

      <Panel title="Competitor comparison">
        <CompetitorTable
          identity={identity}
          scoreCard={report.scoreCard}
          comparison={report.competitorComparison}
        />
      </Panel>

      {report.limitations.length > 0 && (
        <div className="limits">
          <span className="eyebrow">What we couldn&apos;t see</span>
          <ul>
            {report.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .report {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2rem;
          align-items: center;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          box-shadow: var(--shadow-md);
        }
        .headline {
          font-size: 1.5rem;
          line-height: 1.25;
          margin: 0.5rem 0 0.75rem;
        }
        .source {
          font-size: 0.75rem;
          color: var(--ink-3);
          font-family: var(--font-mono);
          line-height: 1.5;
        }
        .source.llm { color: var(--good); }
        .plan {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .section-head h3 {
          font-size: 1.35rem;
          margin-top: 0.25rem;
        }
        .limits {
          background: var(--panel-2);
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius);
          padding: 1.1rem 1.35rem;
        }
        .limits ul {
          margin: 0.6rem 0 0;
          padding-left: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .limits li {
          font-size: 0.83rem;
          color: var(--ink-3);
          line-height: 1.5;
        }
        @media (max-width: 720px) {
          .hero {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: center;
          }
          .headline { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <header>
        <h3>{title}</h3>
        {hint && <span className="hint">{hint}</span>}
      </header>
      {children}
      <style jsx>{`
        .panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem 1.6rem;
          box-shadow: var(--shadow-sm);
        }
        header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        h3 {
          font-size: 1.15rem;
        }
        .hint {
          font-size: 0.76rem;
          color: var(--ink-faint);
        }
      `}</style>
    </section>
  );
}
