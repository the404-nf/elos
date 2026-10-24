// Pure catalog build: a design system as a map of files (path -> parsed JSON or text) in, a Catalog out.
// Browser-safe and database-friendly. The portal stores exactly this map per draft and per version.
import { Catalog, Contract, PageExample, Screen, SystemManifest, TokenGroup, type GradientLayer, type Part, type ResolvedToken } from "@elos/contracts";
import { cssVar, emitComponentCss } from "./css.ts";
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
    if (Array.isArray(raw) && raw.length === 4 && raw.every((n) => typeof n === "number")) return `cubic-bezier(${raw.join(", ")})`;
    if (typeof raw === "object" && raw && "stops" in raw) return gradientCss(raw as GradientLayer, seen);
    if (Array.isArray(raw) && raw.every((l) => typeof l === "object" && l && "stops" in l)) return raw.map((l) => gradientCss(l as GradientLayer, seen)).join(", ");
    return JSON.stringify(raw);
  };
  // Stops stay `var()` references so a gradient follows the theme of the element it paints; `alpha` fades through color-mix.
  const gradientCss = (g: GradientLayer, seen: string[]): string => {
    const stops = g.stops.map((s) => {
      const path = s.color.slice(1, -1);
      if (!flat.has(path)) throw new Error(`Unknown token reference ${s.color} (via ${seen.join(" -> ")})`);
      const color = s.alpha === undefined ? `var(${cssVar(path)})` : `color-mix(in srgb, var(${cssVar(path)}) ${Math.round(s.alpha * 100)}%, transparent)`;
      return s.position ? `${color} ${s.position}` : color;
    });
    const head = g.kind === "linear" ? (g.angle ?? "180deg") : g.kind === "radial" ? `${g.size ?? "farthest-corner"} at ${g.at ?? "center"}` : `from ${g.angle ?? "0deg"} at ${g.at ?? "center"}`;
    return `${g.kind}-gradient(${head}, ${stops.join(", ")})`;
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
  for (const m of Object.values(part.motion ?? {})) yield* [m.duration, m.easing];
  if (part.animation) yield* [part.animation.duration, part.animation.easing];
  if (part.layout?.gap) yield part.layout.gap;
  for (const child of Object.values(part.parts ?? {})) yield* partRefs(child);
}
const isRef = (v: string) => v.startsWith("{") && v.endsWith("}");

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
    const keyframeRefs = Object.values(c.keyframes ?? {}).flatMap((frames) => Object.values(frames).flatMap((decls) => Object.values(decls).filter(isRef)));
    for (const ref of [...[...Object.values(c.anatomy)].flatMap((part) => [...partRefs(part)]), ...keyframeRefs])
      for (const path of expand(ref.slice(1, -1)))
        if (!tokenPaths.has(path)) errors.push(`${c.id}: token {${path}} (from ${ref}) does not exist`);
    for (const part of walk(c.anatomy))
      if (part.animation && !(part.animation.keyframes in (c.keyframes ?? {}))) errors.push(`${c.id}: animation runs unknown keyframes ${part.animation.keyframes}`);

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

  const assets: Catalog["assets"] = {};
  const assetPrefix = `${system.assets}/`;
  for (const p of Object.keys(files).filter((p) => p.startsWith(assetPrefix) && p.endsWith(".svg")).sort()) {
    const [kind, file] = p.slice(assetPrefix.length).split("/");
    if (kind && file) (assets[kind] ??= {})[file.replace(/.svg$/, "")] = String(files[p]);
  }
  const assetErrors = contracts.flatMap((c) => assetParts(c, assets));
  if (assetErrors.length) throw new Error(`Invalid design system:\n  ${assetErrors.join("\n  ")}`);

  const catalog = Catalog.parse({ system, builtAt: new Date().toISOString(), tokens, contracts, pages: [], screens: [], assets });
  const pagePrefix = `${system.pages}/`;
  catalog.pages = Object.keys(files)
    .filter((p) => p.startsWith(pagePrefix) && p.endsWith(".page.json"))
    .sort()
    .map((p) => PageExample.parse(files[p]));
  const pageErrors = catalog.pages.flatMap((pg) => validateComposition(catalog, pg.tree).map((e) => `${pg.id}: ${e}`));
  if (pageErrors.length) throw new Error(`Invalid page examples:\n  ${pageErrors.join("\n  ")}`);
  const screenPrefix = `${system.screens}/`;
  catalog.screens = Object.keys(files)
    .filter((p) => p.startsWith(screenPrefix) && p.endsWith(".screen.json"))
    .sort()
    .map((p) => Screen.parse(files[p]));
  const screenErrors = catalog.screens.flatMap((s) => validateComposition(catalog, s.tree).map((e) => `${s.id}: ${e}`));
  if (screenErrors.length) throw new Error(`Invalid screens:\n  ${screenErrors.join("\n  ")}`);
  return catalog;
}

// An asset part names a kind and the enum prop that picks the file: the enum and the directory must agree exactly.
function assetParts(c: Contract, assets: Catalog["assets"]): string[] {
  const errors: string[] = [];
  for (const part of walk(c.anatomy)) {
    if (!part.asset) continue;
    const prop = c.props.find((p) => p.name === part.asset!.prop);
    const names = prop && typeof prop.type === "object" ? prop.type.enum : null;
    if (!names) {
      errors.push(`${c.id}: asset prop ${part.asset.prop} is not an enum prop`);
      continue;
    }
    const have = new Set(Object.keys(assets[part.asset.kind] ?? {}));
    for (const n of names) if (!have.has(n)) errors.push(`${c.id}: asset ${part.asset.kind}/${n}.svg is missing`);
    for (const n of have) if (!names.includes(n)) errors.push(`${c.id}: asset ${part.asset.kind}/${n}.svg is not in the ${part.asset.prop} enum`);
  }
  return errors;
}

/** Component ids used anywhere in a composition tree. */
export function treeComponents(tree: { component: string; slots?: Record<string, unknown[]> }): Set<string> {
  const out = new Set<string>([tree.component]);
  for (const items of Object.values(tree.slots ?? {}))
    for (const item of items)
      if (typeof item === "object" && item && "component" in item) for (const id of treeComponents(item as never)) out.add(id);
  return out;
}

// Behaviors toggle `hidden`; it must win over any emitted display value. Reduced motion collapses every transition.
const GLOBAL_CSS = `[hidden] {
  display: none !important;
}
@media (prefers-reduced-motion: reduce) {
  [class*="ds-"] {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
`;
export const emitComponentsCss = (catalog: Catalog) => [GLOBAL_CSS, ...catalog.contracts.map(emitComponentCss)].join("\n");

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
        ...Object.entries(part.motion ?? {}).map(([prop, m]) => ({ [`transition ${prop}`]: m.duration, [`transition-timing ${prop}`]: m.easing })),
        part.animation ? { "animation-duration": part.animation.duration, "animation-timing": part.animation.easing } : {},
        part.layout?.gap ? { gap: part.layout.gap } : {},
      ];
      for (const bindings of sets) for (const [prop, ref] of Object.entries(bindings)) for (const path of expand(ref.slice(1, -1))) add(path, `${c.id} ${prop}`);
    }
  }
  for (const [k, v] of map) map.set(k, [...new Set(v)]);
  return map;
}
