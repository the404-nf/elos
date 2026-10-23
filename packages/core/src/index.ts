// Core: loads a design system directory, validates it, resolves tokens, emits the catalog.
// The directory format (system.json + tokens/ + themes/ + contracts/) is also the import/export format.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  Catalog,
  Contract,
  SystemManifest,
  TokenGroup,
  jsonSchemas,
  type Part,
  type ResolvedToken,
  type Theme,
} from "@elos/contracts";
import { cssVar, emitComponentCss } from "./css.ts";
export { cssVar, emitComponentCss, partClass } from "./css.ts";
export * from "./composition.ts";

type Raw = { type?: string; raw: unknown };
type Flat = Map<string, Raw>;

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const isToken = (v: unknown): v is { $value: unknown; $type?: string } =>
  typeof v === "object" && v !== null && "$value" in v;

export function flattenTokens(group: TokenGroup, out: Flat = new Map(), prefix = "", inherited?: string): Flat {
  const groupType = typeof group.$type === "string" ? group.$type : inherited;
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith("$") || value === undefined || typeof value === "string") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isToken(value)) out.set(path, { type: value.$type ?? groupType, raw: value.$value });
    else flattenTokens(value as TokenGroup, out, path, groupType);
  }
  return out;
}

export function mergeTokens(base: TokenGroup, overlay: TokenGroup): TokenGroup {
  const out: TokenGroup = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    const b = out[k];
    out[k] = typeof v === "object" && v && !isToken(v) && typeof b === "object" && b && !isToken(b) ? mergeTokens(b, v) : v;
  }
  return out;
}

const ALIAS = /^\{([^{}]+)\}$/;

export function resolveTokens(flat: Flat): ResolvedToken[] {
  const resolve = (raw: unknown, seen: string[]): string => {
    if (typeof raw === "string") {
      const m = raw.match(ALIAS);
      if (!m) return raw;
      const target = flat.get(m[1]);
      if (!target) throw new Error(`Unknown token reference {${m[1]}} (via ${seen.join(" -> ") || "root"})`);
      if (seen.includes(m[1])) throw new Error(`Token cycle: ${[...seen, m[1]].join(" -> ")}`);
      return resolve(target.raw, [...seen, m[1]]);
    }
    if (typeof raw === "number") return String(raw);
    if (typeof raw === "object" && raw && "value" in raw && "unit" in raw) return `${(raw as any).value}${(raw as any).unit}`;
    return JSON.stringify(raw);
  };
  return [...flat].map(([path, { type, raw }]) => ({ path, type, value: resolve(raw, [path]) }));
}

// Every token ref in a contract must resolve for every value of the props it substitutes.
function* partRefs(part: Part): Generator<string> {
  const byProp = Object.values(part.tokensByProp ?? {}).flatMap((m) => Object.values(m));
  for (const b of [part.tokens, ...Object.values(part.states ?? {}), ...byProp]) if (b) yield* Object.values(b);
  if (part.layout?.gap) yield part.layout.gap;
  for (const child of Object.values(part.parts ?? {})) yield* partRefs(child);
}

export function validateContracts(contracts: Contract[], tokenPaths: Set<string>): string[] {
  const errors: string[] = [];
  const ids = new Set(contracts.map((c) => c.id));
  for (const c of contracts) {
    const enums = new Map(c.props.map((p) => [p.name, typeof p.type === "object" ? p.type.enum : null]));
    const expand = (inner: string): string[] => {
      const m = inner.match(/\{(\w+)\}/);
      if (!m) return [inner];
      const values = enums.get(m[1]);
      if (!values) {
        errors.push(`${c.id}: {${m[1]}} is not an enum prop`);
        return [];
      }
      return values.flatMap((v) => expand(inner.replace(m[0], v)));
    };
    for (const part of Object.values(c.anatomy))
      for (const ref of partRefs(part))
        for (const path of expand(ref.slice(1, -1)))
          if (!tokenPaths.has(path)) errors.push(`${c.id}: token {${path}} (from ${ref}) does not exist`);

    const refIds = [
      ...Object.values(c.relationships).flat(),
      ...[...walk(c.anatomy)].flatMap((p) => [...(p.slot?.accepts ?? []), ...(p.component ? [p.component.id] : [])]),
    ];
    for (const id of refIds) if (!ids.has(id)) errors.push(`${c.id}: references unknown contract ${id}`);
  }
  return errors;
}

function* walk(parts: Record<string, Part>): Generator<Part> {
  for (const p of Object.values(parts)) {
    yield p;
    if (p.parts) yield* walk(p.parts);
  }
}

export function loadSystem(dir: string): Catalog {
  const system = SystemManifest.parse(readJson(join(dir, "system.json")));
  const base = system.tokens.map((f) => TokenGroup.parse(readJson(join(dir, f)))).reduce(mergeTokens, {});
  const tokens: Catalog["tokens"] = { base: resolveTokens(flattenTokens(base)) };
  for (const t of system.themes) tokens[t.name] = resolveTokens(flattenTokens(mergeTokens(base, TokenGroup.parse(readJson(join(dir, t.overlay))))));

  const contractsDir = join(dir, system.contracts);
  const contracts = readdirSync(contractsDir)
    .filter((f) => f.endsWith(".contract.json"))
    .sort()
    .map((f) => Contract.parse(readJson(join(contractsDir, f))));

  const errors = validateContracts(contracts, new Set(tokens.base.map((t) => t.path)));
  if (errors.length) throw new Error(`Invalid design system:\n  ${errors.join("\n  ")}`);

  return Catalog.parse({ system, builtAt: new Date().toISOString(), tokens, contracts });
}

export function emitCss(catalog: Catalog): string {
  const block = (selector: string, tokens: ResolvedToken[]) =>
    `${selector} {\n${tokens.map((t) => `  ${cssVar(t.path)}: ${t.value};`).join("\n")}\n}\n`;
  const base = new Map(catalog.tokens.base.map((t) => [t.path, t.value]));
  const themes = catalog.system.themes.map((th: Theme) =>
    block(th.selector, catalog.tokens[th.name]!.filter((t) => base.get(t.path) !== t.value)),
  );
  return [block(":root", catalog.tokens.base), ...themes].join("\n");
}

export const emitComponentsCss = (catalog: Catalog) => catalog.contracts.map(emitComponentCss).join("\n");

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
