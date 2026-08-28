"use client";

import { useEffect, useState } from "react";

/**
 * Extracts a representative accent color from an image (the app icon) by
 * sampling its pixels on a tiny offscreen canvas. Picks the most saturated,
 * mid-to-bright average so the resulting glow reads as "the app's color" rather
 * than a muddy average. Returns an rgb string, or null until it resolves.
 *
 * Purely decorative — everything degrades to the theme accent if it fails
 * (e.g. a cross-origin image that taints the canvas).
 */
export function useDominantColor(src: string | undefined): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let best = { score: -1, r: 0, g: 0, b: 0 };
        let sum = { r: 0, g: 0, b: 0, n: 0 };

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]!;
          const g = data[i + 1]!;
          const b = data[i + 2]!;
          const a = data[i + 3]!;
          if (a < 200) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const bright = max / 255;
          // favour saturated, mid-bright pixels; avoid near-white/near-black
          const score = sat * (bright > 0.15 && bright < 0.95 ? 1 : 0.2);

          sum.r += r; sum.g += g; sum.b += b; sum.n += 1;
          if (score > best.score) best = { score, r, g, b };
        }

        if (cancelled) return;
        // Fall back to the average if nothing was saturated enough.
        const chosen =
          best.score > 0.25
            ? best
            : sum.n
              ? { r: sum.r / sum.n, g: sum.g / sum.n, b: sum.b / sum.n }
              : null;
        if (chosen) {
          setColor(`rgb(${Math.round(chosen.r)}, ${Math.round(chosen.g)}, ${Math.round(chosen.b)})`);
        }
      } catch {
        /* tainted canvas or unsupported — keep the theme accent */
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return color;
}
