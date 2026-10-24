// The one operation of ADR 0016 as pure functions over a contract: a part, a property, a token reference.
// The editor's inputs (handles, inspector, agent) all produce it; this file applies it and renders the result as text.
import type { Catalog, Contract, Part } from "@elos/contracts";

export type Op = { part: string; property: string; token: string };

export function mapPart(anatomy: Record<string, Part>, name: string, fn: (p: Part) => Part): Record<string, Part> {
  return Object.fromEntries(Object.entries(anatomy).map(([n, p]) => [n, n === name ? fn(p) : p.parts ? { ...p, parts: mapPart(p.parts, name, fn) } : p]));
}
export function findPart(anatomy: Record<string, Part>, name: string): Part | undefined {
  for (const [n, p] of Object.entries(anatomy)) {
    if (n === name) return p;
    const nested = p.parts && findPart(p.parts, name);
    if (nested) return nested;
  }
}
export const partNames = (anatomy: Record<string, Part>): string[] => Object.entries(anatomy).flatMap(([n, p]) => [n, ...(p.parts ? partNames(p.parts) : [])]);

/** Applies one operation. `gap` lives in the part's layout; an empty token removes the binding. */
export function applyOp(contract: Contract, op: Op): Contract {
  return {
    ...contract,
    anatomy: mapPart(contract.anatomy, op.part, (p) => {
      if (op.property === "gap") return { ...p, layout: { ...p.layout, gap: op.token || undefined } };
      const tokens = { ...p.tokens };
      if (op.token) tokens[op.property] = op.token;
      else delete tokens[op.property];
      return { ...p, tokens };
    }),
  };
}

/** Checks an operation against the contract and the catalog before it is applied. Returns the problem, or null. */
export function checkOp(contract: Contract, catalog: Catalog, op: Op): string | null {
  if (!findPart(contract.anatomy, op.part)) return `No part "${op.part}". Parts: ${partNames(contract.anatomy).join(", ")}.`;
  if (!op.property) return "A property is required.";
  if (!op.token) return null;
  const m = op.token.match(/^\{([a-z0-9.-]+)\}$/);
  if (!m) return `"${op.token}" is not a token reference. Write {path}, for example {space.inset.md}.`;
  if (!catalog.tokens.base.some((t) => t.path === m[1])) return `No token "${m[1]}" in the catalog.`;
  return null;
}

/** The token one stop up (+1) or down (-1) the scale of a dimension binding: the siblings of the bound token, by value. Null when there is none. */
export function stepToken(catalog: Catalog, ref: string, dir: 1 | -1): string | null {
  const m = ref.match(/^\{([a-z0-9.-]+)\}$/);
  if (!m) return null;
  const path = m[1]!;
  const parent = path.split(".").slice(0, -1).join(".");
  const px = (v: string) => (/^-?[\d.]+px$/.test(v) ? parseFloat(v) : NaN);
  const stops = catalog.tokens.base
    .filter((t) => t.type === "dimension" && t.path.startsWith(parent + ".") && t.path.split(".").length === path.split(".").length && !Number.isNaN(px(t.value)))
    .sort((a, b) => px(a.value) - px(b.value));
  const current = stops.find((t) => t.path === path);
  if (!current) return null;
  const candidates = stops.filter((t) => (dir > 0 ? px(t.value) > px(current.value) : px(t.value) < px(current.value)));
  const pick = dir > 0 ? candidates[0] : candidates.at(-1);
  return pick ? `{${pick.path}}` : null;
}

const themeValue =(catalog: Catalog, theme: string, ref: string) => {
  const m = ref.match(/^\{([a-z0-9.-]+)\}$/);
  if (!m) return /\{\w+\}/.test(ref) ? "(per prop)" : ref;
  return (catalog.tokens[theme] ?? catalog.tokens.base).find((t) => t.path === m[1])?.value ?? "?";
};

/** The deterministic render: every part's bindings resolved per theme, as text an agent can read. */
export function render(contract: Contract, catalog: Catalog, only?: string): string {
  const themes = Object.keys(catalog.tokens);
  const lines: string[] = [];
  const walk = (anatomy: Record<string, Part>, depth: number) => {
    for (const [name, p] of Object.entries(anatomy)) {
      if (!only || only === name) {
        const indent = "  ".repeat(depth);
        const layout = p.layout ? ` layout ${[p.layout.display, p.layout.direction, p.layout.gap && `gap ${p.layout.gap} = ${themes.map((th) => themeValue(catalog, th, p.layout!.gap!)).join(" | ")}`].filter(Boolean).join(" ")}` : "";
        lines.push(`${indent}${name} <${p.element ?? "div"}>${layout}${p.slot ? " (slot)" : ""}`);
        for (const [prop, ref] of Object.entries(p.tokens ?? {})) lines.push(`${indent}  ${prop}: ${ref} = ${themes.map((th) => themeValue(catalog, th, ref)).join(" | ")}`);
        for (const [state, b] of Object.entries(p.states ?? {})) for (const [prop, ref] of Object.entries(b ?? {})) lines.push(`${indent}  [${state}] ${prop}: ${ref} = ${themes.map((th) => themeValue(catalog, th, ref)).join(" | ")}`);
      }
      if (p.parts) walk(p.parts, only && only !== name ? depth : depth + 1);
    }
  };
  walk(contract.anatomy, 0);
  return `Themes: ${themes.join(" | ")}\n${lines.join("\n")}`;
}

/** The token vocabulary for the agent's system prompt: path, type, value per theme, description. Semantic tokens first. */
export function vocabulary(catalog: Catalog): string {
  const themes = Object.keys(catalog.tokens);
  const line = (t: Catalog["tokens"]["base"][number]) => {
    const values = themes.map((th) => (catalog.tokens[th] ?? catalog.tokens.base).find((x) => x.path === t.path)?.value ?? "?");
    const v = new Set(values).size === 1 ? values[0] : values.join(" | ");
    return `{${t.path}} ${t.type ?? ""} ${v}${t.description ? ` — ${t.description}` : ""}`;
  };
  const base = catalog.tokens.base;
  return [...base.filter((t) => t.alias), ...base.filter((t) => !t.alias)].map(line).join("\n");
}
