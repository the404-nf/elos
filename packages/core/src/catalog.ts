// Pure catalog build: a design system as a map of files (path -> parsed JSON or text) in, a Catalog out.
// Browser-safe and database-friendly. The portal stores exactly this map per draft and per version.
import { Catalog, Contract, PageExample, SystemManifest, TokenGroup, type Part, type ResolvedToken } from "@elos/contracts";
import { emitComponentCss } from "./css.ts";
import { validateComposition } from "./composition.ts";

export type SystemFiles = Record<string, unknown>;

type Raw = { type?: string; raw: unknown; description?: string };
type Flat = Map<string, Raw>;

const isToken = (v: unknown): v is { $value: unknown; $type?: string; $description?: string } =>
  typeof v === "object" && v !== null && "$value" in v;

export function flattenTokens(group: TokenGroup, out: Flat = new Map(), prefix = "", inherited?: string): Flat {
  const groupType = typeof group.$type === "string" ? group.$type : inherited;
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith("$") || value === undefined || typeof value === "string") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isToken(value)) out.set(path, { type: value.$type ?? groupType, raw: value.$value, description: value.$description });
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
      const target = flat.get(m[1]!);
      if (!target) throw new Error(`Unknown token reference {${m[1]}} (via ${seen.join(" -> ") || "root"})`);
      if (seen.includes(m[1]!)) throw new Error(`Token cycle: ${[...seen, m[1]].join(" -> ")}`);
      return resolve(target.raw, [...seen, m[1]!]);
    }
    if (typeof raw === "number") return String(raw);
    if (typeof raw === "object" && raw && "value" in raw && "unit" in raw) return `${(raw as any).value}${(raw as any).unit}`;
    return JSON.stringify(raw);
  };
  return [...flat].map(([path, { type, raw, description }]) => ({
    path,
    type,
    value: resolve(raw, [path]),
    alias: typeof raw === "string" ? raw.match(ALIAS)?.[1] : undefined,
    description,
  }));
}

// Every token ref in a contract must resolve for every value of the props it substitutes.
function* partRefs(part: Part): Generator<string> {
  const byProp = Object.values(part.tokensByProp ?? {}).flatMap((m) => Object.values(m));
  for (const b of [part.tokens, ...Object.values(part.states ?? {}), ...byProp]) if (b) yield* Object.values(b);
  if (part.layout?.gap) yield part.layout.gap;
  for (const child of Object.values(part.parts ?? {})) yield* partRefs(child);
}

function* walk(parts: Record<string, Part>): Generator<Part> {
  for (const p of Object.values(parts)) {
    yield p;
    if (p.parts) yield* walk(p.parts);
  }
}

export function validateContracts(contracts: Contract[], tokenPaths: Set<string>): string[] {
  const errors: string[] = [];
  const ids = new Set(contracts.map((c) => c.id));
  for (const c of contracts) {
    const enums = new Map(c.props.map((p) => [p.name, typeof p.type === "object" ? p.type.enum : null]));
    const expand = (inner: string): string[] => {
      const m = inner.match(/\{(\w+)\}/);
      if (!m) return [inner];
      const values = enums.get(m[1]!);
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

/** Builds and validates a catalog from a system's files. Throws with every error listed. */
export function buildCatalog(files: SystemFiles): Catalog {
  const need = (path: string) => {
    if (!(path in files)) throw new Error(`Missing file ${path}`);
    return files[path];
  };
  const system = SystemManifest.parse(need("system.json"));
  const base = system.tokens.map((f) => TokenGroup.parse(need(f))).reduce(mergeTokens, {});
  const tokens: Catalog["tokens"] = { base: resolveTokens(flattenTokens(base)) };
  for (const t of system.themes) tokens[t.name] = resolveTokens(flattenTokens(mergeTokens(base, TokenGroup.parse(need(t.overlay)))));

  const prefix = `${system.contracts}/`;
  const contracts = Object.keys(files)
    .filter((p) => p.startsWith(prefix) && p.endsWith(".contract.json"))
    .sort()
    .map((p) => Contract.parse(files[p]));

  const errors = validateContracts(contracts, new Set(tokens.base.map((t) => t.path)));
  if (errors.length) throw new Error(`Invalid design system:\n  ${errors.join("\n  ")}`);

  const catalog = Catalog.parse({ system, builtAt: new Date().toISOString(), tokens, contracts, pages: [] });
  const pagePrefix = `${system.pages}/`;
  catalog.pages = Object.keys(files)
    .filter((p) => p.startsWith(pagePrefix) && p.endsWith(".page.json"))
    .sort()
    .map((p) => PageExample.parse(files[p]));
  const pageErrors = catalog.pages.flatMap((pg) => validateComposition(catalog, pg.tree).map((e) => `${pg.id}: ${e}`));
  if (pageErrors.length) throw new Error(`Invalid page examples:\n  ${pageErrors.join("\n  ")}`);
  return catalog;
}

/** Component ids used anywhere in a composition tree. */
export function treeComponents(tree: { component: string; slots?: Record<string, unknown[]> }): Set<string> {
  const out = new Set<string>([tree.component]);
  for (const items of Object.values(tree.slots ?? {}))
    for (const item of items)
      if (typeof item === "object" && item && "component" in item) for (const id of treeComponents(item as never)) out.add(id);
  return out;
}

// Behaviors toggle `hidden`; it must win over any emitted display value.
export const emitComponentsCss = (catalog: Catalog) => ["[hidden] {\n  display: none !important;\n}\n", ...catalog.contracts.map(emitComponentCss)].join("\n");

/** token path -> "ds.x css-prop" list, from every binding in every contract (substitutions expanded). */
export function tokenUsage(catalog: Catalog): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (path: string, use: string) => map.set(path, [...(map.get(path) ?? []), use]);
  for (const c of catalog.contracts) {
    const enums = new Map(c.props.map((p) => [p.name, typeof p.type === "object" ? p.type.enum : null]));
    const expand = (inner: string): string[] => {
      const m = inner.match(/\{(\w+)\}/);
      return m ? (enums.get(m[1]!) ?? []).flatMap((v) => expand(inner.replace(m[0], v))) : [inner];
    };
    for (const part of walk(c.anatomy)) {
      const sets: Record<string, string>[] = [
        part.tokens ?? {},
        ...Object.values(part.states ?? {}),
        ...Object.values(part.tokensByProp ?? {}).flatMap((m) => Object.values(m)),
        part.layout?.gap ? { gap: part.layout.gap } : {},
      ];
      for (const bindings of sets) for (const [prop, ref] of Object.entries(bindings)) for (const path of expand(ref.slice(1, -1))) add(path, `${c.id} ${prop}`);
    }
  }
  for (const [k, v] of map) map.set(k, [...new Set(v)]);
  return map;
}
