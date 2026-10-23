// Exports a catalog as the file tree of a "Design System" artifact (Claude's design-mode input):
// list-shaped tokens.json, the brand book, one README and one static preview per component, the cover.
// Usage: node packages/react/src/export-design-system.ts "<system-dir>" <out-dir> [--by <name>]
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ResolvedToken } from "@elos/contracts";
import { build, contractToMarkdown, emitComponentsCss, tokenUsage } from "@elos/core";
import { ElosProvider, Render } from "./index.ts";
import { zagBehaviors } from "./behaviors.ts";

const [dir, out, ...rest] = process.argv.slice(2);
if (!dir || !out) throw new Error("usage: export-design-system <system-dir> <out-dir> [--by <name>]");
const by = rest[rest.indexOf("--by") + 1] || "Claude";

const catalog = build(dir);
const project = join(out, "project");
const write = (path: string, text: string) => {
  mkdirSync(join(project, path, ".."), { recursive: true });
  writeFileSync(join(project, path), text);
};
const dash = (path: string) => path.replace(/\./g, "-");
const pascal = (name: string) => name.replace(/(^|[\s-])(\w)/g, (_, __, c) => c.toUpperCase()).replace(/\W/g, "");

// ---------- tokens.json: lists per family, color per theme ----------
const themes = ["light", ...catalog.system.themes.map((t) => t.name)];
const byTheme = (path: string) => Object.fromEntries(themes.map((t) => [t, (catalog.tokens[t === "light" ? "base" : t] ?? []).find((x) => x.path === path)?.value]));
const usedBy = tokenUsage(catalog);
const usage = (t: ResolvedToken) => t.description ?? (usedBy.get(t.path)?.join("; ") || (t.path.split(".").length <= 3 ? "Primitive. Bind semantic tokens to it, not components." : ""));
const entry = (t: ResolvedToken) => ({ name: dash(t.path), value: t.value, usage: usage(t) });

const base = catalog.tokens.base;
const families: Record<string, { tokens: unknown[] }> = {};
const family = (key: string) => (families[key] ??= { tokens: [] });
for (const t of base) {
  const head = t.path.split(".")[0]!;
  if (t.type === "color") family("color").tokens.push({ name: dash(t.path), value: byTheme(t.path), usage: usage(t) });
  else if (head === "space") family("spacing").tokens.push(entry(t));
  else if (head === "radius") family("radius").tokens.push(entry(t));
  else family(head === "type" ? "typeScale" : head).tokens.push(entry(t)); // font, opacity, border, component tokens
}
const get = (p: string) => base.find((t) => t.path === p)?.value ?? "";
const tokensJson = {
  name: catalog.system.name,
  version: 1,
  color: { themes: themes.map((t) => ({ id: t, name: t[0]!.toUpperCase() + t.slice(1) })), tokens: families.color?.tokens ?? [] },
  type: {
    fonts: [],
    families: { sans: get("font.family.sans") },
    groups: [
      {
        name: "Text",
        family: "sans",
        note: "One family, four roles. Weight does the hierarchy work.",
        styles: ["title", "heading", "body", "caption"].map((role) => ({
          name: role,
          fontSize: get(`type.${role}.size`),
          lineHeight: 1.5,
          fontWeight: Number(get(`type.${role}.weight`)),
          usage: `ds.text variant ${role}`,
        })),
      },
    ],
  },
  spacing: families.spacing,
  radius: families.radius,
  ...Object.fromEntries(Object.entries(families).filter(([k]) => !["color", "spacing", "radius"].includes(k))),
};
write("tokens.json", JSON.stringify(tokensJson, null, 2));

// ---------- brand book and cover: authored files in the system directory ----------
write("README.md", existsSync(join(dir, "README.md")) ? readFileSync(join(dir, "README.md"), "utf8") : `# ${catalog.system.name}\n`);
if (existsSync(join(dir, "cover.html"))) {
  mkdirSync(join(project, "components", "Cover"), { recursive: true });
  copyFileSync(join(dir, "cover.html"), join(project, "components", "Cover", "preview.html"));
}

// ---------- components: guidelines from the contract, static preview from its examples ----------
const css = emitComponentsCss(catalog);
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;
const HEIGHT: Record<string, number> = { overlay: 360, navigation: 180, layout: 200 };
const files: Record<string, string> = {};

for (const c of catalog.contracts) {
  const name = pascal(c.name);
  files[`components/${name}/README.md`] = contractToMarkdown(c);
  const examples = c.examples.length ? c.examples : [];
  const markup = examples
    .map((e) => {
      const tree = c.id === "ds.dialog" ? { ...e.tree, props: { ...e.tree.props, open: true } } : e.tree;
      return `<figure style="margin:0"><div>${renderToStaticMarkup(h(ElosProvider, { catalog, behaviors: zagBehaviors }, h(Render, { tree })))}</div><figcaption style="margin-top:6px;font-size:12px;color:var(--color-text-secondary)">${e.name}</figcaption></figure>`;
    })
    .join("\n");
  const height = HEIGHT[c.category] ?? (c.id === "ds.card" ? 200 : 88);
  files[`components/${name}/preview.html`] = `<!-- @dsCard group="${c.category}" height=${height} subtitle="${c.id}" -->
<!doctype html>
<html>
<head><meta charset="utf-8"><title>${c.name} — preview</title>${fonts}
<style>${css}
body{margin:0;padding:16px;background:var(--color-surface-canvas);color:var(--color-text-primary);font-family:var(--font-family-sans)}
.row{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start}</style></head>
<body><div class="row">${markup || `<p style="color:var(--color-text-secondary)">Used inside ${c.relationships.within.join(", ") || "other components"}; see their previews.</p>`}</div></body>
</html>
`;
}
for (const [path, text] of Object.entries(files)) write(path, text);

// ---------- index ----------
const index = {
  v: 3,
  layout: "files",
  createdOnFiles: { v: 1, at: new Date().toISOString() },
  title: catalog.system.name,
  namespace: pascal(catalog.system.name),
  libraries: [],
  sections: {},
  groups: [],
  assetGroups: {},
  blobs: {},
  docs: { readme: "project/README.md", sections: [] },
  lastChange: { by, via: "Claude Code", at: new Date().toISOString(), note: `Exported from catalog ${catalog.system.id}@${catalog.system.version}` },
};
write("design-system.json", JSON.stringify(index, null, 2));
console.log(`wrote ${Object.keys(files).length + 3} files under ${project}`);
