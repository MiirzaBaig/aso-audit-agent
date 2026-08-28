"use client";

import type { AppIdentity } from "@aso/shared";
import Image from "next/image";
import type { AuditResult } from "@/lib/api";
import { ScoreGauge } from "./ScoreGauge";
import { DimensionBars } from "./DimensionBars";
import { Recommendations } from "./Recommendations";
import { CompetitorTable } from "./CompetitorTable";
import { ReviewEvidence } from "./ReviewEvidence";

/**
 * The full audit as a single diagnostic document. Sections are separated by
 * hairline rules and eyebrow headers rather than boxed cards — the whole thing
 * reads top-to-bottom like a well-set report. One framed element only: the
 * score hero, because it's the headline.
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
      <section className="hero reveal" style={{ ["--i" as string]: 0 }}>
        <div className="hero-left">
          <div className="who">
            <Image src={identity.iconUrl} alt="" width={44} height={44} className="ic" />
            <div>
              <h2>{identity.name}</h2>
              <span className="dev">{identity.developer} · {identity.primaryCategory}</span>
            </div>
          </div>
          <p className="headline">{report.headline}</p>
          <span className={`source ${analysisSource}`}>
            <span className="src-dot" aria-hidden />
            {analysisSource === "llm"
              ? "Plan written by the NIM analyst · scores computed in code"
              : "Plan generated deterministically · scores computed in code"}
          </span>
        </div>
        <div className="hero-right">
          <ScoreGauge overall={report.scoreCard.overall} grade={report.scoreCard.grade} />
        </div>
      </section>

      <Block eyebrow="Dimension breakdown" hint="Tap a row for the evidence" i={1}>
        <DimensionBars dimensions={report.scoreCard.dimensions} />
      </Block>

      {report.reviewEvidence.length > 0 && (
        <Block eyebrow="Review evidence" hint="Real reviews behind the score" i={2}>
          <ReviewEvidence themes={report.reviewEvidence} total={report.reviewsAnalysed} />
        </Block>
      )}

      <Block eyebrow="Action plan" hint="Ranked by leverage" i={3}>
        <Recommendations recommendations={report.recommendations} />
      </Block>

      <Block eyebrow="Competitor comparison" i={4}>
        <CompetitorTable
          identity={identity}
          scoreCard={report.scoreCard}
          comparison={report.competitorComparison}
        />
      </Block>

      {report.limitations.length > 0 && (
        <div className="limits reveal" style={{ ["--i" as string]: 5 }}>
          <span className="label">What we couldn&apos;t see</span>
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
          gap: 3rem;
        }
        /* the one framed element — the headline score */
        .hero {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2.5rem;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line-2);
          border-radius: var(--r-lg);
          padding: 2rem;
          box-shadow: var(--shadow-2);
        }
        .who {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 1rem;
        }
        .ic { width: 44px; height: 44px; }
        .who h2 { font-size: 1.1rem; font-weight: 600; }
        .dev { font-size: 0.82rem; color: var(--ink-3); }
        .headline {
          font-family: var(--font-display);
          font-size: 1.55rem;
          line-height: 1.22;
          letter-spacing: -0.025em;
          margin: 0 0 1rem;
          color: var(--ink);
          text-wrap: balance;
          max-width: 30ch;
        }
        .source {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.76rem;
          color: var(--ink-3);
          font-family: var(--font-mono);
        }
        .src-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ink-4); }
        .source.llm .src-dot { background: var(--good); }
        .source.llm { color: var(--good); }
        .limits {
          border-top: 1px solid var(--line);
          padding-top: 1.25rem;
        }
        .limits ul {
          margin: 0.7rem 0 0;
          padding-left: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .limits li { font-size: 0.83rem; color: var(--ink-3); line-height: 1.5; }
        @media (max-width: 720px) {
          .report { gap: 2.25rem; }
          .hero { grid-template-columns: 1fr; }
          .headline { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}

/** An open section: eyebrow header over a hairline rule, then content. No box. */
function Block({
  eyebrow,
  hint,
  i,
  children,
}: {
  eyebrow: string;
  hint?: string;
  i: number;
  children: React.ReactNode;
}) {
  return (
    <section className="block reveal" style={{ ["--i" as string]: i }}>
      <header>
        <span className="label">{eyebrow}</span>
        {hint && <span className="hint">{hint}</span>}
      </header>
      {children}
      <style jsx>{`
        .block { display: flex; flex-direction: column; gap: 1.25rem; }
        header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
        }
        .hint { font-size: 0.78rem; color: var(--ink-4); }
      `}</style>
    </section>
  );
}
