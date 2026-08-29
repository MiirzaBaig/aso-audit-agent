"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AppIdentity } from "@aso/shared";

/**
 * Loading state = a skeleton of the actual report (gauge + dimension bars),
 * not a spinner. It previews the shape the content will take, so the wait feels
 * like the page filling in rather than blocking. A quiet status line names the
 * real pipeline stage underway.
 */
const BASE_STAGES = [
  "Reading listing metadata",
  "Pulling ratings & reviews",
  "Finding category competitors",
  "Checking live search positions",
] as const;

export function AuditingSkeleton({
  identity,
  deepScan = false,
}: {
  identity: AppIdentity;
  deepScan?: boolean;
}) {
  // With Deep scan on, OCR is the slow step — name it so the extra wait reads
  // as work, not a hang.
  const stages = [
    ...BASE_STAGES,
    ...(deepScan ? (["Reading your screenshots with OCR"] as const) : []),
    "Scoring 10 dimensions",
    "Writing the action plan",
  ];

  const [stage, setStage] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setInterval(
      () => setStage((s) => Math.min(s + 1, stages.length - 1)),
      deepScan ? 1900 : 1500,
    );
    // the backend runs on a free tier that dozes off when idle. if we're still
    // waiting after ~9s, it's probably just waking up — say so instead of
    // leaving the user guessing.
    const slowTimer = setTimeout(() => setSlow(true), 9000);
    return () => {
      clearInterval(id);
      clearTimeout(slowTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages.length, deepScan]);

  return (
    <div className="wrap">
      {slow && (
        <div className="wakeup reveal" role="status">
          <span className="zzz" aria-hidden>😴</span>
          <span>
            <b>hang tight, the server&apos;s waking up.</b> it sleeps on the free tier when
            nobody&apos;s around, so the first run after a quiet spell takes a few extra seconds.
            it&apos;ll be snappy right after.
          </span>
        </div>
      )}
      <div className="statusbar reveal">
        <Image src={identity.iconUrl} alt="" width={30} height={30} className="ic" />
        <div className="who">
          <strong>{identity.name}</strong>
          <span className="mono">{identity.developer}</span>
        </div>
        {deepScan && <span className="deep mono">✦ deep scan</span>}
        <div className="status">
          <span className="dot" aria-hidden />
          <span key={stage} className="stage-text">{stages[stage]}…</span>
        </div>
      </div>

      <div className="hero-skeleton reveal" style={{ ["--i" as string]: 1 }}>
        <div className="left">
          <div className="skeleton line w40" />
          <div className="skeleton line w90" />
          <div className="skeleton line w70" />
        </div>
        <div className="gauge-skeleton">
          <div className="ring" />
        </div>
      </div>

      <div className="bars-skeleton reveal" style={{ ["--i" as string]: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="bar-row" key={i}>
            <div className="skeleton line w20" />
            <div className="skeleton track" style={{ ["--w" as string]: `${45 + ((i * 13) % 45)}%` }} />
            <div className="skeleton chip-sk" />
          </div>
        ))}
      </div>

      <style jsx>{`
        .wrap {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .wakeup {
          display: flex;
          align-items: flex-start;
          gap: 0.7rem;
          padding: 0.85rem 1.05rem;
          border-radius: var(--r-md);
          background: var(--accent-wash);
          border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--ink-2);
        }
        .wakeup b { color: var(--ink); font-weight: 600; }
        .zzz {
          font-size: 1.1rem;
          line-height: 1.3;
          animation: bob 2s ease-in-out infinite;
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .statusbar {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          padding: 0.85rem 1.1rem;
          box-shadow: var(--shadow-1);
        }
        .ic { width: 30px; height: 30px; }
        .who { display: flex; flex-direction: column; min-width: 0; }
        .who strong { font-size: 0.9rem; }
        .who span { font-size: 0.76rem; color: var(--ink-3); }
        .deep {
          margin-left: auto;
          font-size: 0.66rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-wash);
          border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          white-space: nowrap;
        }
        .status {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: var(--ink-2);
        }
        /* when the deep badge is present it takes the auto-gap; status hugs it */
        .deep + .status { margin-left: 0.85rem; }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .stage-text { animation: fade 0.4s ease; }
        .hero-skeleton {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2rem;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-lg);
          padding: 1.75rem;
        }
        .left { display: flex; flex-direction: column; gap: 0.7rem; }
        .line { height: 14px; }
        .w40 { width: 40%; } .w90 { width: 90%; } .w70 { width: 70%; }
        .w20 { width: 22%; height: 12px; }
        .gauge-skeleton { display: grid; place-items: center; }
        .ring {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 12px solid var(--surface-2);
          border-top-color: var(--line-2);
          animation: spin 1.1s linear infinite;
        }
        .bars-skeleton {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .bar-row {
          display: grid;
          grid-template-columns: minmax(90px, 1fr) 2fr auto;
          gap: 1rem;
          align-items: center;
        }
        .track { height: 8px; width: var(--w); }
        .chip-sk { width: 42px; height: 14px; }
        @media (max-width: 620px) {
          .hero-skeleton { grid-template-columns: 1fr; justify-items: center; }
        }
      `}</style>
    </div>
  );
}
