import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { themeColors, themeInitScript } from "./theme.ts";

describe("champagne theme", () => {
  it("defaults to midnight and keeps ivory for an explicit light choice", () => {
    assert.equal(themeColors.dark, "#0B1626");
    assert.equal(themeColors.light, "#F3EEE4");
    assert.match(themeInitScript, /stored==="light"\?"light":"dark"/);
    assert.match(themeInitScript, /#0B1626/);
    assert.match(themeInitScript, /#F3EEE4/);
    assert.equal(themeInitScript.includes("palette"), false);
  });

  it("uses champagne in the stylesheet and drops the preview switcher", async () => {
    const css = await readFile("app/globals.css", "utf8");
    for (const hex of ["#0B1626", "#122236", "#F3EEE4", "#C8A96A"]) {
      assert.match(css, new RegExp(hex));
    }
    assert.equal(css.includes("data-palette"), false);
    assert.equal(css.includes("palette-switch"), false);
    assert.equal(css.includes("#6d28d9"), false);
    assert.equal(css.includes("#f8f7fc"), false);
    assert.equal(css.includes("#f59e0b"), false);
    for (const layout of ["app/(en)/layout.tsx", "app/(ar)/layout.tsx"]) {
      const source = await readFile(layout, "utf8");
      assert.equal(source.includes("PreviewPalette"), false);
      assert.match(source, /themeInitScript/);
      assert.match(source, /themeColors\.dark/);
    }
    const image = await readFile("app/(en)/opengraph-image/route.tsx", "utf8");
    assert.match(image, /#0B1626/);
    assert.match(image, /#F3EEE4/);
    assert.match(image, /#C8A96A/);
  });
});
