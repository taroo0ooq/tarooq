"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  paletteColors,
  paletteIds,
  paletteStorageKey,
  paletteThemeColor,
  type PaletteId,
} from "@/lib/palette";

const options: { id: PaletteId | ""; label: string; title: string }[] = [
  { id: "", label: "Current", title: "Current site colors" },
  { id: "champagne", label: "Champagne", title: paletteColors.champagne.name },
  { id: "brass", label: "Brass", title: paletteColors.brass.name },
  { id: "emerald", label: "Emerald", title: paletteColors.emerald.name },
];

function writePalette(palette: PaletteId | "") {
  const root = document.documentElement;
  if (palette) root.setAttribute("data-palette", palette);
  else root.removeAttribute("data-palette");
  try {
    localStorage.setItem(paletteStorageKey, palette);
  } catch {
    // The cookie still carries the choice when storage is blocked.
  }
  document.cookie = `${paletteStorageKey}=${encodeURIComponent(palette)}; Path=/; Max-Age=${palette ? 2592000 : 0}; SameSite=Lax`;
  const url = new URL(window.location.href);
  if (palette) url.searchParams.set("palette", palette);
  else url.searchParams.delete("palette");
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) history.replaceState(null, "", next);
  const theme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const color = paletteThemeColor(palette, theme);
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", color);
  });
}

export function PaletteSwitcher() {
  const pathname = usePathname();
  const [palette, setPalette] = useState<PaletteId | "" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-palette");
    const chosen = paletteIds.find((id) => id === current) ?? "";
    setPalette(chosen);
    const url = new URL(window.location.href);
    const inUrl = url.searchParams.get("palette");
    if (chosen) {
      if (inUrl !== chosen) {
        url.searchParams.set("palette", chosen);
        history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      }
    } else if (inUrl === "champagne" || inUrl === "brass" || inUrl === "emerald" || inUrl === "default" || inUrl === "current") {
      url.searchParams.delete("palette");
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [pathname]);

  return (
    <div className="palette-switch" role="radiogroup" aria-label="Preview palette">
      {options.map((option) => (
        <button
          aria-checked={palette === option.id}
          className={palette === option.id ? "on" : undefined}
          key={option.label}
          role="radio"
          title={option.title}
          type="button"
          onClick={() => {
            writePalette(option.id);
            setPalette(option.id);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
