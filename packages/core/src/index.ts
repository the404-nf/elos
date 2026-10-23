// Node entry: reads a design system directory into files, builds the catalog, writes the dist artifacts.
// The directory format (system.json + tokens/ + themes/ + contracts/) is also the import/export format.
// Browser code imports the subpaths (./catalog, ./css, ./composition, ./markdown), never this file.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { jsonSchemas, type Catalog } from "@elos/contracts";
import { buildCatalog, emitComponentsCss, type SystemFiles } from "./catalog.ts";
import { emitCss } from "./css.ts";

export * from "./catalog.ts";
export * from "./css.ts";
export * from "./composition.ts";
export { contractToMarkdown } from "./markdown.ts";

/** Reads every file of a system directory: JSON parsed, text kept, dist/ and node_modules/ skipped. */
export function readSystemFiles(dir: string): SystemFiles {
  const files: SystemFiles = {};
  const visit = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (name === "dist" || name === "node_modules" || name.startsWith(".")) continue;
      if (statSync(full).isDirectory()) visit(full);
      else {
        const rel = relative(dir, full).split("\\").join("/");
        const text = readFileSync(full, "utf8");
        files[rel] = name.endsWith(".json") ? JSON.parse(text) : text;
      }
    }
  };
  visit(dir);
  return files;
}

export const loadSystem = (dir: string): Catalog => buildCatalog(readSystemFiles(dir));

export function build(dir: string, outDir = join(dir, "dist")): Catalog {
  const catalog = loadSystem(dir);
  mkdirSync(join(outDir, "schema"), { recursive: true });
  writeFileSync(join(outDir, "catalog.json"), JSON.stringify(catalog, null, 2));
  writeFileSync(join(outDir, "tokens.css"), emitCss(catalog));
  writeFileSync(join(outDir, "components.css"), emitComponentsCss(catalog));
  for (const [name, schema] of Object.entries(jsonSchemas()))
    writeFileSync(join(outDir, "schema", `${name}.schema.json`), JSON.stringify(schema, null, 2));
  return catalog;
}
