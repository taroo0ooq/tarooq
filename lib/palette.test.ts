import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { paletteColors, paletteInitScript, paletteThemeColor, resolvePalette } from "./palette.ts";

describe("preview palettes", () => {
  it("lets the query win and otherwise keeps the stored choice", () => {
    assert.equal(resolvePalette("champagne", "brass"), "champagne");
    assert.equal(resolvePalette(null, "emerald"), "emerald");
    assert.equal(resolvePalette("default", "brass"), "");
    assert.equal(resolvePalette("current", "emerald"), "");
    assert.equal(resolvePalette("nope", null), "");
    assert.equal(resolvePalette(null, null), "");
  });

  it("uses each theme background, and the current colors when no palette is set", () => {
    assert.equal(paletteThemeColor(null, "light"), "#f8f7fc");
    assert.equal(paletteThemeColor("champagne", "light"), "#0B1626");
    assert.equal(paletteThemeColor("champagne", "dark"), "#0B1626");
    assert.equal(paletteThemeColor("brass", "light"), "#FFFFFF");
    assert.equal(paletteThemeColor("brass", "dark"), "#111111");
    assert.equal(paletteThemeColor("emerald", "dark"), "#071C18");
    assert.equal(paletteColors.champagne.accent, "#C8A96A");
    assert.equal(paletteColors.brass.accent, "#A67C3D");
    assert.equal(paletteColors.emerald.accent, "#C9A75E");
  });

  it("boots from the same ids and never uses pure black", async () => {
    assert.match(paletteInitScript, /champagne/);
    assert.match(paletteInitScript, /brass/);
    assert.match(paletteInitScript, /emerald/);
    assert.equal(paletteInitScript.includes("#000000"), false);
    assert.equal(paletteInitScript.includes("#000;"), false);
    const css = await readFile("app/globals.css", "utf8");
    for (const palette of Object.values(paletteColors)) {
      assert.match(css, new RegExp(palette.light));
      assert.match(css, new RegExp(palette.dark));
      assert.match(css, new RegExp(palette.ink));
      assert.match(css, new RegExp(palette.accent));
    }
    const themed = css.slice(css.indexOf("html[data-palette]"));
    assert.equal(themed.includes("#000000"), false);
    assert.equal(themed.includes(": #000;") || themed.includes(": #000 }"), false);
  });

  it("renders the switcher only outside production", async () => {
    const gate = await readFile("components/PreviewPalette.tsx", "utf8");
    assert.match(gate, /VERCEL_ENV === "production"/);
    assert.match(gate, /return null/);
    for (const layout of ["app/(en)/layout.tsx", "app/(ar)/layout.tsx"]) {
      const source = await readFile(layout, "utf8");
      assert.match(source, /PreviewPalette/);
    }
  });
});
