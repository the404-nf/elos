// Turns a contract's anatomy into CSS rules bound to token variables.
// Framework-agnostic and browser-safe: the React renderer, the HTML widget and the portal preview all use this output.
import type { Contract, Part, State } from "@elos/contracts";

export const cssVar = (path: string) => `--${path.replace(/\./g, "-")}`;

const STATE_SELECTORS: Record<State, string[]> = {
  hover: [":hover"],
  "focus-visible": [":focus-visible"],
  active: [":active"],
  disabled: [":disabled", "[data-disabled]"],
  selected: ["[data-selected]"],
  checked: [":checked", '[data-state="checked"]'],
  open: ['[data-state="open"]'],
  invalid: ['[aria-invalid="true"]', "[data-invalid]"],
};

const LAYOUT_PROPS: Record<string, string> = { display: "display", direction: "flex-direction", align: "align-items", justify: "justify-content" };

export const partClass = (contractId: string, part: string) => `${contractId.replace(/\./g, "-")}__${part}`;

type Decls = Record<string, string>;
type Rule = { attrs: Record<string, string>; state?: State; decls: Decls };

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
  Object.assign(d, part.styles ?? {});
  return d;
}

export function emitComponentCss(contract: Contract): string {
  const enums = new Map(contract.props.flatMap((p) => (typeof p.type === "object" ? [[p.name, p.type.enum] as const] : [])));
  const [rootName] = Object.keys(contract.anatomy);
  const rootCls = `.${partClass(contract.id, rootName)}`;
  const out: string[] = [];

  const selector = (part: string, { attrs, state }: Rule) => {
    const root = rootCls + Object.entries(attrs).map(([p, v]) => `[data-${p}="${v}"]`).join("");
    const target = part === rootName ? root : `${root} .${partClass(contract.id, part)}`;
    return state ? STATE_SELECTORS[state].map((s) => target + s).join(", ") : target;
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
      for (const [value, styles] of Object.entries(byValue)) rules.push({ attrs: { [prop]: value }, decls: { ...styles } });
    for (const [state, bindings] of Object.entries(part.states ?? {})) rules.push(...expandBindings(bindings, enums, state as State));
    for (const [state, styles] of Object.entries(part.stylesByState ?? {})) rules.push({ attrs: {}, state: state as State, decls: { ...styles } });
    for (const [prop, byValue] of Object.entries(part.tokensByProp ?? {}))
      for (const [value, bindings] of Object.entries(byValue))
        rules.push(...expandBindings(bindings, enums).map((r) => ({ ...r, attrs: { ...r.attrs, [prop]: value } })));
    for (const r of rules) write(name, r);
    for (const [childName, child] of Object.entries(part.parts ?? {})) visit(childName, child);
  };
  visit(rootName, contract.anatomy[rootName]!);
  return out.join("\n") + "\n";
}
