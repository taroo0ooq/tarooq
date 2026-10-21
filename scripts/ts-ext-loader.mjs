import { extname } from "node:path";

const runnable = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"]);

/** Lets node:test import extensionless TypeScript modules in this repo. */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let relative = specifier.slice(2);
    if (!runnable.has(extname(relative))) relative += ".ts";
    return nextResolve(new URL(`../${relative}`, import.meta.url).href, context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !runnable.has(extname(specifier))) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
