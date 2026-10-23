#!/usr/bin/env node
// Usage: node packages/core/src/cli.ts <system-dir> [--out <dir>]
import { build } from "./index.ts";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
if (!dir) {
  console.error("usage: elos-build <system-dir> [--out <dir>]");
  process.exit(1);
}
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : undefined;

try {
  const catalog = build(dir, out);
  const themes = Object.keys(catalog.tokens).join(", ");
  console.log(`${catalog.system.name} v${catalog.system.version}: ${catalog.contracts.length} contracts, ${catalog.tokens.base.length} tokens, themes: ${themes}`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
