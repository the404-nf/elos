// Renders every contract example in every theme to a static HTML page. Seed of the HTML emitter
// and the portal preview. Usage: node packages/react/src/preview.ts "<system-dir>"
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build, emitCss, emitComponentsCss } from "@elos/core";
import { ElosProvider, Render } from "./index.ts";

const dir = process.argv[2];
if (!dir) throw new Error("usage: preview <system-dir>");
const catalog = build(dir);

const section = (theme: string, selectorAttr: string) => `
<section ${selectorAttr} style="background: var(--color-surface-canvas); color: var(--color-text-primary); padding: 32px; font-family: var(--font-family-sans)">
  <h2 style="margin:0 0 16px">${theme}</h2>
  ${catalog.contracts
    .map(
      (c) => `<h3 style="margin:24px 0 8px; font-weight: 500">${c.name} <code style="opacity:.6">${c.id}</code></h3>
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        ${c.examples.map((e) => renderToStaticMarkup(h(ElosProvider, { catalog }, h(Render, { tree: e.tree })))).join("\n")}
      </div>`,
    )
    .join("\n")}
</section>`;

const html = `<!doctype html><meta charset="utf-8"><title>${catalog.system.name} preview</title>
<style>${emitCss(catalog)}\n${emitComponentsCss(catalog)}\nbody{margin:0}</style>
${section("light", "")}
${catalog.system.themes.map((t) => section(t.name, t.selector.replace(/^\[|\]$/g, "").replace(/"/g, '"'))).join("\n")}
`;
const out = join(dir, "dist", "preview.html");
writeFileSync(out, html);
console.log(`wrote ${out}`);
