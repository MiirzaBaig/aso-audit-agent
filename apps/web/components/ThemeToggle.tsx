"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * A light/dark toggle that stamps data-theme on <html> so it wins over the OS
 * media query. Reads the initial value from an inline script (see below) to
 * avoid a flash of the wrong theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme") as Theme | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("aso-theme", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title="Toggle theme"
    >
      {theme === "dark" ? "☾" : "☀"}
      <style jsx>{`
        .theme-toggle {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--panel);
          color: var(--ink-2);
          font-size: 1rem;
          transition: border-color 0.15s, color 0.15s, transform 0.15s;
        }
        .theme-toggle:hover {
          color: var(--accent);
          border-color: var(--accent);
          transform: rotate(15deg);
        }
      `}</style>
    </button>
  );
}

/** Inline, render-blocking script that applies the stored theme before paint. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('aso-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
