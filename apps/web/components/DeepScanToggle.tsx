"use client";

/**
 * The "Deep scan" switch: opts a single audit into screenshot OCR (reads the
 * on-image caption text Apple indexes). A real speed/depth trade-off the user
 * owns — so we surface it as a compact, tactile pill that never shifts layout
 * between states.
 */
export function DeepScanToggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`ds ${on ? "on" : ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Deep scan — OCR the screenshots"
        className="hit"
        onClick={() => !disabled && onChange(!on)}
        disabled={disabled}
      >
        <span className="track">
          <span className="thumb">
            <span className="glyph" aria-hidden>
              {on ? "✦" : ""}
            </span>
          </span>
        </span>
        <span className="copy">
          <span className="title">
            Deep scan
            <span className="pill">{on ? "ON" : "OFF"}</span>
          </span>
          <span className="hint">
            {on
              ? "OCRs your screenshots · slower, sharper"
              : "add screenshot OCR · a little slower"}
          </span>
        </span>
      </button>

      <style jsx>{`
        /* fixed footprint — border + bg animate in place, no layout shift */
        .ds {
          border: 1px solid transparent;
          border-radius: 999px;
          transition: background 0.25s var(--ease), border-color 0.25s var(--ease);
        }
        .ds.on {
          background: var(--accent-wash);
          border-color: color-mix(in srgb, var(--accent) 32%, transparent);
        }
        .hit {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          background: none;
          border: none;
          padding: 0.4rem 0.7rem 0.4rem 0.5rem;
          border-radius: 999px;
          text-align: left;
          transition: opacity 0.15s;
        }
        .hit:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .hit:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .track {
          position: relative;
          width: 42px;
          height: 24px;
          border-radius: 999px;
          background: var(--surface-2);
          border: 1px solid var(--line-2);
          flex: none;
          transition: background 0.28s var(--ease), border-color 0.28s;
        }
        .ds.on .track {
          background: var(--accent);
          border-color: var(--accent);
        }
        .thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
          display: grid;
          place-items: center;
          transition: transform 0.3s var(--ease);
        }
        .ds.on .thumb {
          transform: translateX(18px);
        }
        .hit:active .thumb {
          width: 22px;
        }
        .glyph {
          font-size: 0.6rem;
          color: var(--accent);
          animation: pop 0.3s var(--ease);
        }
        @keyframes pop {
          from {
            transform: scale(0) rotate(-40deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0);
            opacity: 1;
          }
        }
        .copy {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
          min-width: 0;
        }
        .title {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.2;
        }
        .pill {
          font-family: var(--font-mono);
          font-size: 0.56rem;
          letter-spacing: 0.08em;
          padding: 0.06rem 0.32rem;
          border-radius: 5px;
          color: var(--ink-4);
          background: var(--surface-2);
          border: 1px solid var(--line);
          transition: color 0.25s, background 0.25s, border-color 0.25s;
        }
        .ds.on .pill {
          color: var(--accent);
          background: var(--surface);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
        }
        .hint {
          font-size: 0.7rem;
          color: var(--ink-4);
          white-space: nowrap;
          transition: color 0.2s;
        }
        .ds.on .hint {
          color: color-mix(in srgb, var(--accent) 55%, var(--ink-3));
        }
      `}</style>
    </div>
  );
}
