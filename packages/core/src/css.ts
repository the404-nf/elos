// Turns a contract's anatomy into CSS rules bound to token variables.
// Framework-agnostic and browser-safe: the React renderer, the HTML widget and the portal preview all use this output.
import type { Catalog, Contract, Part, ResolvedToken, State, Theme } from "@elos/contracts";

export const cssVar = (path: string) => `--${path.replace(/\./g, "-")}`;

/** Token variables: the base under :root, each theme's differing values under its selector.
 *  An alias is emitted as var(--target), so changing one variable at runtime cascades. */
export function emitCss(catalog: Catalog): string {
  const decl = (t: ResolvedToken) => `  ${cssVar(t.path)}: ${t.alias ? `var(${cssVar(t.alias)})` : t.value};`;
  const block = (selector: string, tokens: ResolvedToken[]) => `${selector} {\n${tokens.map(decl).join("\n")}\n}\n`;
  const base = new Map(catalog.tokens.base.map((t) => [t.path, `${t.alias}|${t.value}`]));
  const themes = catalog.system.themes.map((th: Theme) =>
    block(th.selector, catalog.tokens[th.name]!.filter((t) => base.get(t.path) !== `${t.alias}|${t.value}`)),
  );
  const fonts = catalog.system.fonts.map((f) => `@import url("${f.url}");`);
  return [...(fonts.length ? [fonts.join("\n") + "\n"] : []), block(":root", catalog.tokens.base), ...themes].join("\n");
}

const ref = (v: string) => (v.startsWith("{") && v.endsWith("}") ? `var(${cssVar(v.slice(1, -1))})` : v);
export const keyframesName = (contractId: string, name: string) => `${contractId.replace(/\./g, "-")}-${name}`;

const STATE_SELECTORS: Record<State, string[]> = {
  hover: [":hover"],
  "focus-visible": [":focus-visible"],
  active: [":active"],
  disabled: [":disabled", "[data-disabled]"],
  selected: ["[data-selected]"],
  checked: [":checked", '[data-state="checked"]'],
  open: ['[data-state="open"]'],
  invalid: ['[aria-invalid="true"]', "[data-invalid]"],
  highlighted: ["[data-highlighted]"],
};

const LAYOUT_PROPS: Record<string, string> = { display: "display", direction: "flex-direction", align: "align-items", justify: "justify-content" };

export const partClass = (contractId: string, part: string) => `${contractId.replace(/\./g, "-")}__${part}`;

type Decls = Record<string, string>;
type Rule = { attrs: Record<string, string>; state?: State; onRoot?: boolean; decls: Decls }; // onRoot: the state is the root's, the decls a child's

/** `{color.action.{variant}.bg}` -> one rule per combination of the substituted props' enum values. */
function expandBindings(bindings: Record<string, string>, enums: Map<string, string[]>, state?: State): Rule[] {
  const byKey = new Map<string, Rule>();
  for (const [cssProp, ref] of Object.entries(bindings)) {
    const inner = ref.slice(1, -1);
    const props = [...inner.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    const combos = props.reduce<Record<string, string>[]>(
      (acc, p) => acc.flatMap((c) => (enums.get(p) ?? []).map((v) => ({ ...c, [p]: v }))),
      [{}],
    );
    for (const attrs of combos) {
      const path = Object.entries(attrs).reduce((s, [p, v]) => s.replace(`{${p}}`, v), inner);
      const key = JSON.stringify([attrs, state ?? ""]);
      const rule = byKey.get(key) ?? { attrs, state, decls: {} };
      rule.decls[cssProp] = `var(${cssVar(path)})`;
      byKey.set(key, rule);
    }
  }
  return [...byKey.values()];
}

function baseDecls(part: Part): Decls {
  const d: Decls = {};
  for (const [k, cssProp] of Object.entries(LAYOUT_PROPS)) {
    const v = part.layout?.[k as keyof NonNullable<Part["layout"]>];
    if (v) d[cssProp] = v;
  }
  if (part.element === "button") Object.assign(d, { border: "0", cursor: "pointer", font: "inherit" });
  if (part.element === "input" || part.element === "select") Object.assign(d, { font: "inherit" });
  for (const key of Object.keys(part.tokens ?? {})) {
    const m = key.match(/^(border(?:-\w+)?)-width$/); // tokens cannot express a style keyword
    if (m) d[`${m[1]}-style`] = "solid";
  }
  if (part.states && "focus-visible" in part.states) Object.assign(d, { outline: "2px solid transparent", "outline-offset": "2px" });
  if (part.motion && Object.keys(part.motion).length)
    d.transition = Object.entries(part.motion)
      .map(([prop, m]) => `${prop} var(${cssVar(m.duration.slice(1, -1))}) var(${cssVar(m.easing.slice(1, -1))})`)
      .join(", ");
  Object.assign(d, part.styles ?? {});
  return d;
}

export function emitComponentCss(contract: Contract): string {
  const enums = new Map(contract.props.flatMap((p) => (typeof p.type === "object" ? [[p.name, p.type.enum] as const] : [])));
  const booleans = new Set(contract.props.filter((p) => p.type === "boolean").map((p) => p.name));
  const attr = (prop: string, value: string) => (booleans.has(prop) && value === "true" ? "" : value);
  const [rootName] = Object.keys(contract.anatomy);
  const rootCls = `.${partClass(contract.id, rootName)}`;
  const out: string[] = [];

  const selector = (part: string, { attrs, state, onRoot }: Rule) => {
    const root = rootCls + Object.entries(attrs).map(([p, v]) => (v === "" ? `[data-${p}]` : `[data-${p}="${v}"]`)).join(""); // a true boolean prop renders as data-<prop>=""
    const child = part === rootName ? "" : ` .${partClass(contract.id, part)}`;
    if (!state) return root + child;
    return STATE_SELECTORS[state].map((s) => (onRoot ? root + s + child : root + child + s)).join(", ");
  };
  const write = (part: string, rule: Rule) => {
    const body = Object.entries(rule.decls).map(([k, v]) => `  ${k}: ${v};`).join("\n");
    if (body) out.push(`${selector(part, rule)} {\n${body}\n}`);
  };

  const visit = (name: string, part: Part) => {
    const bindings = { ...part.tokens, ...(part.layout?.gap ? { gap: part.layout.gap } : {}) };
    const rules = expandBindings(bindings, enums);
    const baseIdx = rules.findIndex((r) => Object.keys(r.attrs).length === 0);
    const base = baseIdx >= 0 ? rules.splice(baseIdx, 1)[0]! : { attrs: {}, decls: {} };
    base.decls = { ...baseDecls(part), ...base.decls };
    rules.unshift(base);
    for (const [prop, byValue] of Object.entries(part.stylesByProp ?? {}))
      for (const [value, styles] of Object.entries(byValue)) rules.push({ attrs: { [prop]: attr(prop, value) }, decls: { ...styles } });
    for (const [state, bindings] of Object.entries(part.states ?? {})) rules.push(...expandBindings(bindings, enums, state as State));
    for (const [state, styles] of Object.entries(part.stylesByState ?? {})) rules.push({ attrs: {}, state: state as State, decls: { ...styles } });
    if (part.animation) {
      const a = part.animation;
      const decl = `${keyframesName(contract.id, a.keyframes)} ${ref(a.duration)} ${ref(a.easing)} ${a.iterations ?? 1}`;
      if (a.on) rules.push({ attrs: {}, state: a.on, onRoot: true, decls: { animation: decl } });
      else base.decls.animation = decl;
    }
    for (const [prop, byValue] of Object.entries(part.tokensByProp ?? {}))
      for (const [value, bindings] of Object.entries(byValue))
        rules.push(...expandBindings(bindings, enums).map((r) => ({ ...r, attrs: { ...r.attrs, [prop]: attr(prop, value) } })));
    for (const r of rules) write(name, r);
    for (const [childName, child] of Object.entries(part.parts ?? {})) visit(childName, child);
  };
  visit(rootName, contract.anatomy[rootName]!);
  for (const [name, frames] of Object.entries(contract.keyframes ?? {})) {
    const body = Object.entries(frames)
      .map(([offset, decls]) => `  ${offset} { ${Object.entries(decls).map(([k, v]) => `${k}: ${ref(v)};`).join(" ")} }`)
      .join("\n");
    out.push(`@keyframes ${keyframesName(contract.id, name)} {\n${body}\n}`);
  }
  return out.join("\n") + "\n";
}
