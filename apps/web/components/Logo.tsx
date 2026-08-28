/**
 * The ASO Audit mark: a gauge arc — the same instrument as the report's score
 * gauge — with a needle that doubles as the stem of an "A". It reads as
 * "measurement / score" at a glance and stays crisp from favicon to hero size.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="ASO Audit"
    >
      {/* rounded tile */}
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      {/* track arc (faint) */}
      <path
        d="M8 21a8 8 0 1 1 16 0"
        stroke="var(--on-accent)"
        strokeOpacity="0.35"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* value arc (bright) — ~72% sweep */}
      <path
        d="M8 21a8 8 0 0 1 13.7-5.6"
        stroke="var(--on-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* needle */}
      <path
        d="M16 21 L20.2 13.4"
        stroke="var(--on-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="21" r="2" fill="var(--on-accent)" />
    </svg>
  );
}
