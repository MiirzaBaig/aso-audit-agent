"use client";

import Image from "next/image";
import type { AppIdentity } from "@aso/shared";

/**
 * The human-in-the-loop gate. Shows the surface metadata the workflow fetched
 * and asks the user to confirm before the (slower, heavier) audit runs — this
 * is the UI face of the workflow's suspend/resume.
 */
export function ConfirmCard({
  identity,
  onConfirm,
  onReject,
  busy,
}: {
  identity: AppIdentity;
  onConfirm: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <div className="confirm">
      <span className="eyebrow">Is this the app you meant?</span>
      <div className="body">
        <Image src={identity.iconUrl} alt="" width={72} height={72} className="ic big" />
        <div className="info">
          <h3>{identity.name}</h3>
          <p className="dev">{identity.developer}</p>
          <div className="chips">
            <span className="chip">{identity.primaryCategory}</span>
            <span className="chip mono">{identity.country.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={onReject} disabled={busy}>
          No, wrong app
        </button>
        <button className="btn primary" onClick={onConfirm} disabled={busy}>
          {busy ? "Running audit…" : "Yes — run the audit"}
        </button>
      </div>

      <style jsx>{`
        .confirm {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.35rem;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          animation: pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes pop {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .body {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .info { min-width: 0; }
        h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .dev {
          margin: 0.15rem 0 0.5rem;
          color: var(--ink-3);
          font-size: 0.9rem;
        }
        .chips {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .chip {
          font-size: 0.72rem;
          color: var(--ink-2);
          background: var(--panel-2);
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 0.15rem 0.5rem;
        }
        .actions {
          display: flex;
          gap: 0.6rem;
          justify-content: flex-end;
        }
        .btn {
          border-radius: 10px;
          padding: 0.6rem 1.05rem;
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid transparent;
          transition: transform 0.12s, background 0.12s, border-color 0.12s;
        }
        .btn:disabled { opacity: 0.6; cursor: default; }
        .btn:not(:disabled):hover { transform: translateY(-1px); }
        .ghost {
          background: transparent;
          border-color: var(--border-strong);
          color: var(--ink-2);
        }
        .primary {
          background: var(--accent);
          color: var(--accent-ink);
        }
        .primary:not(:disabled):hover { background: var(--accent-strong); }
        :global(.ic.big) { border-radius: 22%; }
        @media (max-width: 480px) {
          .actions { flex-direction: column-reverse; }
          .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
