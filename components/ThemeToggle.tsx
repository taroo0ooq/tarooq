"use client";

import { useEffect, useState } from "react";

const storageKey = "tarooq-theme";

function themeColor(theme: "light" | "dark") {
  return theme === "dark" ? "#070910" : "#f8f7fc";
}

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", themeColor(theme));
  });
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Private browsing can block storage. The choice still applies for this view.
  }
}

export function ThemeToggle({ darkLabel, lightLabel }: { darkLabel: string; lightLabel: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={next === "dark" ? darkLabel : lightLabel}
      aria-pressed={theme === "dark"}
      onClick={() => {
        const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        const chosen = current === "dark" ? "light" : "dark";
        applyTheme(chosen);
        setTheme(chosen);
      }}
    >
      <svg className="icon-moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <svg className="icon-sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M19.2 4.8l-1.6 1.6M6.4 17.6l-1.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
