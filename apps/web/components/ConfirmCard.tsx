"use client";

import Image from "next/image";
import type { AppIdentity } from "@aso/shared";
import { useDominantColor } from "@/lib/use-dominant-color";

/**
 * The human-in-the-loop gate — the UI face of the workflow's suspend/resume,
 * and the reviewer's first real interaction. Treated as a signature moment: an
 * ambient halo behind the icon, a choreographed entrance, and tactile
 * micro-interactions on every control.
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
  const glow = useDominantColor(`/api/icon?url=${encodeURIComponent(identity.iconUrl)}`);
  const accent = glow ?? "var(--accent)";

  return (
    <div className="confirm" style={{ ["--glow" as string]: accent }}>
      <div className="glow" aria-hidden />
      <span className="eyebrow label">Confirm the app</span>

      <div className="body">
        <div className="icon-wrap">
          <Image
            src={identity.iconUrl}
            alt=""
            width={80}
            height={80}
            className="ic app-ic"
          />
          <span className="ic-halo" aria-hidden />
        </div>

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
        <span className="hint">Not quite?</span>
        <button className="btn ghost" onClick={onReject} disabled={busy}>
          Wrong app
        </button>
        <button className="btn primary" onClick={onConfirm} disabled={busy}>
          <span className="sheen" aria-hidden />
          Run the audit <span className="arr">→</span>
        </button>
      </div>

      <style jsx>{`
        .confirm {
          position: relative;
          overflow: hidden;
          background: var(--surface);
          border: 1px solid var(--line-2);
          border-radius: var(--r-lg);
          padding: 1.6rem 1.7rem;
          box-shadow: var(--shadow-3);
          display: flex;
          flex-direction: column;
          gap: 1.3rem;
          animation: cardIn 0.55s var(--ease) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* ambient spotlight in the top-left corner */
        .glow {
          position: absolute;
          top: -40%;
          left: -10%;
          width: 380px;
          height: 380px;
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--glow) 26%, transparent),
            transparent 62%
          );
          filter: blur(12px);
          opacity: 0.55;
          transition: background 0.6s ease;
          pointer-events: none;
          animation: fade 0.9s ease 0.15s both;
        }
        .eyebrow { position: relative; }
        .body {
          position: relative;
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }
        .icon-wrap {
          position: relative;
          flex: none;
          animation: iconIn 0.6s var(--ease) 0.08s both;
        }
        @keyframes iconIn {
          from { opacity: 0; transform: scale(0.8) rotate(-6deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }
        .app-ic {
          position: relative;
          z-index: 1;
          width: 80px;
          height: 80px;
          border-radius: 22.5%;
          box-shadow: var(--shadow-2);
          transition: transform 0.3s var(--ease);
        }
        .icon-wrap:hover .app-ic {
          transform: scale(1.05) rotate(-3deg);
        }
        /* soft halo echoing the icon behind it */
        .ic-halo {
          position: absolute;
          inset: -14px;
          border-radius: 30%;
          background: color-mix(in srgb, var(--glow) 38%, transparent);
          filter: blur(22px);
          opacity: 0.55;
          z-index: 0;
          transition: opacity 0.3s, background 0.6s ease;
        }
        .icon-wrap:hover .ic-halo { opacity: 0.75; }
        .info {
          min-width: 0;
          animation: rise 0.5s var(--ease) 0.16s both;
        }
        h3 {
          font-size: 1.4rem;
          font-weight: 600;
          letter-spacing: -0.03em;
        }
        .dev {
          margin: 0.2rem 0 0.7rem;
          color: var(--ink-3);
          font-size: 0.95rem;
        }
        .chips { display: flex; gap: 0.45rem; flex-wrap: wrap; }
        .chip {
          font-size: 0.75rem;
          color: var(--ink-2);
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: var(--r-xs);
          padding: 0.25rem 0.6rem;
          transition: transform 0.15s var(--ease), border-color 0.15s, color 0.15s;
        }
        .chip:hover {
          transform: translateY(-1px);
          border-color: var(--line-2);
          color: var(--ink);
        }
        .actions {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          justify-content: flex-end;
          border-top: 1px solid var(--line);
          padding-top: 1.2rem;
          animation: rise 0.5s var(--ease) 0.24s both;
        }
        .hint {
          margin-right: auto;
          font-size: 0.8rem;
          color: var(--ink-4);
        }
        .btn {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          border-radius: var(--r-sm);
          padding: 0.6rem 1.15rem;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid transparent;
          transition: transform 0.16s var(--ease), background 0.16s, border-color 0.16s,
            box-shadow 0.16s;
        }
        .btn:disabled { opacity: 0.5; cursor: default; }
        .ghost {
          background: transparent;
          border-color: var(--line-2);
          color: var(--ink-2);
        }
        .ghost:not(:disabled):hover {
          border-color: var(--ink-3);
          color: var(--ink);
          transform: translateY(-1px);
        }
        .primary {
          background: var(--ink);
          color: var(--bg);
          box-shadow: var(--shadow-2);
        }
        .primary:not(:disabled):hover {
          background: var(--accent);
          color: var(--on-accent);
          transform: translateY(-2px);
          box-shadow: 0 10px 26px -8px color-mix(in srgb, var(--accent) 55%, transparent);
        }
        .primary:not(:disabled):active { transform: translateY(0); }
        /* sheen sweep on hover */
        .sheen {
          position: absolute;
          top: 0;
          left: -120%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            100deg,
            transparent,
            color-mix(in srgb, var(--bg) 45%, transparent),
            transparent
          );
          transform: skewX(-18deg);
          transition: left 0.55s var(--ease);
          pointer-events: none;
        }
        .primary:not(:disabled):hover .sheen { left: 130%; }
        .arr {
          transition: transform 0.18s var(--ease);
        }
        .primary:not(:disabled):hover .arr { transform: translateX(4px); }
        @media (max-width: 480px) {
          .body { flex-direction: column; text-align: center; align-items: center; }
          .actions { flex-wrap: wrap; }
          .hint { width: 100%; text-align: center; margin: 0 0 0.3rem; }
          .btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
