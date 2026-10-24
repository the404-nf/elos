"use client";
// Component page. Reading: an overview generated from the contract, the contract as code or form, accessibility, usage.
// Editing, modelled on a design tool's component editor (ADR 0016): the canvas shows the component set (every variant
// across, every size down), the left pane holds the parts tree, the instance's own properties (text, optional slots) and
// the state to preview, the right pane is the inspector by section (Layout, Fill, Stroke, Text, Effects, Motion) where every
// control writes a token binding. Handles on the selected part walk the token scale. Save validates the whole system first.
import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StyleKey, type Catalog, type Contract, type Part } from "@elos/contracts";
import { emitComponentCss, partClass } from "@elos/core/css";
import { ElosProvider, Render, type Node } from "@elos/react";
import { zagBehaviors } from "@elos/react/behaviors";
import { Badge, Button, Card, Checkbox, Field, Icon, Input, Link, Nav, NavItem, Option, Select, Stack, Table, TableCell, TableRow, Text, Textarea, elements } from "@/components/elos-client.tsx";
import { CopyButton } from "@/components/copy-button.tsx";
import { PageHead } from "@/components/page-head.tsx";
import { saveContract } from "../actions.ts";
import { ContractForm } from "./contract-form.tsx";

type Bindings = Record<string, string>;
type Stop = { path: string; value: number; label: string };
type Tokens = Catalog["tokens"]["base"];
type Token = Tokens[number];
type EnumProp = Contract["props"][number] & { type: { enum: string[] } };
type Tree = Node & { props?: Record<string, unknown> };
const TABS = ["overview", "contract", "accessibility", "usage"] as const;
type Tab = (typeof TABS)[number];
const SUPPORT_TONE = { native: "success", degraded: "warning", unsupported: "danger" } as const;
const mono = { fontFamily: "var(--font-family-mono)" } as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The inspector's sections: which css properties belong where, like a design tool's panel. */
const SECTIONS: { name: string; props: RegExp }[] = [
  { name: "Layout", props: /^(gap|padding|padding-.*|margin.*|width|height|min-.*|max-.*|top|left|right|bottom|inset)$/ },
  { name: "Fill", props: /^(background|background-color|background-image|accent-color|fill)$/ },
  { name: "Stroke", props: /^(border.*|outline.*|stroke.*)$/ },
  { name: "Text", props: /^(color|font.*|letter-spacing|line-height|text-.*)$/ },
  { name: "Effects", props: /^(box-shadow|opacity|backdrop-filter|filter|--.*)$/ },
];
const sectionOf = (prop: string) => SECTIONS.find((s) => s.props.test(prop))?.name ?? "Other";
/** Which tokens a property may bind to. */
const tokensFor = (prop: string, tokens: Tokens): Token[] => {
  const semanticFirst = (ts: Token[]) => [...ts.filter((t) => t.alias), ...ts.filter((t) => !t.alias)];
  if (/background-image|^background$/.test(prop)) return [...tokens.filter((t) => t.type === "gradient"), ...semanticFirst(tokens.filter((t) => t.type === "color"))];
  if (/color|fill|stroke$|accent-color|^--/.test(prop)) return semanticFirst(tokens.filter((t) => t.type === "color"));
  if (/font-family/.test(prop)) return tokens.filter((t) => t.type === "fontFamily");
  if (/font-weight/.test(prop)) return tokens.filter((t) => t.type === "fontWeight");
  if (/box-shadow/.test(prop)) return tokens.filter((t) => t.type === "shadow");
  if (/opacity/.test(prop)) return tokens.filter((t) => t.path.startsWith("opacity."));
  if (/line-height/.test(prop)) return tokens.filter((t) => t.path.endsWith(".line-height"));
  return semanticFirst(tokens.filter((t) => t.type === "dimension"));
};

function mapPart(anatomy: Record<string, Part>, name: string, fn: (p: Part) => Part): Record<string, Part> {
  return Object.fromEntries(Object.entries(anatomy).map(([n, p]) => [n, n === name ? fn(p) : p.parts ? { ...p, parts: mapPart(p.parts, name, fn) } : p]));
}
function findPart(anatomy: Record<string, Part>, name: string): Part | undefined {
  for (const [n, p] of Object.entries(anatomy)) {
    if (n === name) return p;
    const nested = p.parts && findPart(p.parts, name);
    if (nested) return nested;
  }
}
const partList = (anatomy: Record<string, Part>, depth = 0): { name: string; part: Part; depth: number }[] =>
  Object.entries(anatomy).flatMap(([name, part]) => [{ name, part, depth }, ...(part.parts ? partList(part.parts, depth + 1) : [])]);

/** The dimension tokens a binding can snap to: the siblings of the bound token, one stop per value, sorted. */
function stopsFor(ref: string, tokens: Tokens): { current: number; stops: Stop[] } | null {
  const m = ref.match(/^\{([a-z0-9.-]+)\}$/);
  if (!m) return null;
  const path = m[1]!;
  const parent = path.split(".").slice(0, -1).join(".");
  const px = (v: string) => (/^-?[\d.]+px$/.test(v) ? parseFloat(v) : NaN);
  const siblings = tokens.filter((t) => t.type === "dimension" && t.path.startsWith(parent + ".") && t.path.split(".").length === path.split(".").length && !Number.isNaN(px(t.value)));
  const byValue = new Map<number, Stop>();
  for (const t of siblings.sort((a, b) => (a.path === path ? -1 : b.path === path ? 1 : 0))) {
    const v = px(t.value);
    const stop = byValue.get(v);
    if (stop) stop.label += ` ${t.path.split(".").pop()}`; // ponytail: tokens that share a value share a stop; the bound one, else the first, names it
    else byValue.set(v, { path: t.path, value: v, label: t.path.split(".").pop()! });
  }
  const stops = [...byValue.values()].sort((a, b) => a.value - b.value);
  const current = stops.findIndex((st) => st.value === px(tokens.find((t) => t.path === path)?.value ?? ""));
  return stops.length > 1 && current >= 0 ? { current, stops } : null;
}
/** Substitutes a prop placeholder with the instance's value, so `{space.inset.{size}}` resolves for the shown size. */
const concrete = (ref: string, props: Record<string, unknown>) => ref.replace(/\{(\w+)\}(?=[^{]*$|\.)/g, (m, p) => (p in props ? String(props[p]) : m));

function ScaleSlider({ label, tokenRef, tokens, onPick }: { label: string; tokenRef: string; tokens: Tokens; onPick: (ref: string) => void }) {
  const scale = stopsFor(tokenRef, tokens);
  if (!scale) return null;
  const { current, stops } = scale;
  return (
    <div className="scale">
      <input type="range" min={0} max={stops.length - 1} step={1} value={current} aria-label={`${label} on the ${tokenRef.slice(1, -1).split(".").slice(0, -1).join(".")} scale`}
        aria-valuetext={`${stops[current]!.label}, ${stops[current]!.value}px`} onChange={(e) => onPick(`{${stops[Number(e.target.value)]!.path}}`)} />
      <div className="scale-labels">{stops.map((st) => <Text key={st.path} as="span" variant="eyebrow" tone={st.path === stops[current]!.path ? "primary" : "tertiary"} text={String(st.value)} title={st.label} />)}</div>
    </div>
  );
}

/** One property of the inspector: a token picker of the property's category, a swatch for colors, a slider for dimensions. */
function PropRow({ prop, value, tokens, onChange, onRemove }: { prop: string; value: string; tokens: Tokens; onChange: (ref: string) => void; onRemove: () => void }) {
  const choices = tokensFor(prop, tokens);
  const bound = tokens.find((t) => `{${t.path}}` === value);
  const substituted = /\{\w+\}/.test(value.slice(1, -1));
  return (
    <Stack gap="xs">
      <div className="prop">
        <Text as="code" variant="code" tone="secondary" text={prop} title={prop} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} />
        {substituted || !choices.length ? (
          <Input size="sm" list="token-refs" value={value} aria-label={`${prop} binding`} onChange={(e) => onChange(e.target.value)} style={mono} title={substituted ? "Follows a prop: the placeholder picks the token per value." : undefined} />
        ) : (
          <Select size="sm" value={bound ? value : ""} aria-label={`${prop} token`} onChange={(e) => onChange(e.target.value)} style={mono}>
            {!bound && <Option value="" label={value || "choose a token"} />}
            {choices.map((t) => <Option key={t.path} value={`{${t.path}}`} label={t.type === "color" || t.type === "dimension" ? `${t.path}  ${t.value.length > 12 ? "" : t.value}` : t.path} />)}
          </Select>
        )}
        <Stack direction="row" gap="xs" align="center">
          {bound?.type === "color" && <span style={{ width: 16, height: 16, borderRadius: 4, flex: "none", background: bound.value, boxShadow: "inset 0 0 0 1px var(--color-border-default)" }} title={bound.value} />}
          <Button label="×" variant="ghost" size="sm" aria-label={`Remove ${prop}`} onClick={onRemove} />
        </Stack>
      </div>
      <ScaleSlider label={prop} tokenRef={value} tokens={tokens} onPick={onChange} />
    </Stack>
  );
}

/** Bindings grouped by section, each property a row; "+" on a section adds a property to it. */
function Sections({ bindings, tokens, onChange, layout }: { bindings: Bindings; tokens: Tokens; onChange: (b: Bindings) => void; layout?: ReactNode }) {
  const [adding, setAdding] = useState<string | null>(null);
  const groups = new Map<string, [string, string][]>(SECTIONS.map((s) => [s.name, []]));
  for (const [k, v] of Object.entries(bindings)) groups.set(sectionOf(k), [...(groups.get(sectionOf(k)) ?? []), [k, v]]);
  return (
    <>
      {[...groups].map(([name, rows]) =>
        rows.length > 0 || name === "Layout" || adding === name ? (
          <div key={name} className="sect">
            <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
              <Text as="span" variant="label" text={name} />
              <Button label="+" variant="ghost" size="sm" aria-label={`Add a ${name} property`} onClick={() => setAdding(adding === name ? null : name)} />
            </Stack>
            {name === "Layout" && layout}
            {rows.map(([k, v]) => <PropRow key={k} prop={k} value={v} tokens={tokens} onChange={(ref) => onChange({ ...bindings, [k]: ref })} onRemove={() => onChange(Object.fromEntries(Object.entries(bindings).filter(([kk]) => kk !== k)))} />)}
            {adding === name && (
              <Input size="sm" placeholder="css property, then Enter" aria-label={`New ${name} property`} style={mono}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { const k = (e.target as HTMLInputElement).value.trim(); if (e.key === "Enter" && k) { onChange({ ...bindings, [k]: "" }); setAdding(null); } if (e.key === "Escape") setAdding(null); }} />
            )}
          </div>
        ) : null,
      )}
    </>
  );
}

type Axis = "x" | "y" | "d";
const STEP = 18; // pixels of drag per stop
const ZOOMS = [25, 50, 75, 100, 150, 200, 300, 400];

/** Handles on the selected part: edges move padding and height, the corner moves radius, the dot between two children moves gap.
 *  Each one walks the token scale, so a drag lands on a token, never a pixel. The same operation the inspector produces. */
function Handles({ canvas, selector, part, tokens, onOp, version }: { canvas: RefObject<HTMLDivElement | null>; selector: string; part: Part | undefined; tokens: Tokens; onOp: (property: string, ref: string) => void; version: unknown }) {
  const [geo, setGeo] = useState<{ box: DOMRect; kids: DOMRect[] } | null>(null);
  const drag = useRef<{ property: string; axis: Axis; x: number; y: number; start: number; stops: Stop[] } | null>(null);
  useEffect(() => {
    const c = canvas.current;
    const measure = () => {
      const el = c?.querySelector(selector) as HTMLElement | null;
      if (!c || !el) return setGeo(null);
      const cr = c.getBoundingClientRect();
      const rel = (r: DOMRect) => new DOMRect(r.left - cr.left, r.top - cr.top, r.width, r.height);
      setGeo({ box: rel(el.getBoundingClientRect()), kids: [...el.children].slice(0, 2).map((k) => rel(k.getBoundingClientRect())) });
    };
    measure();
    const ro = c ? new ResizeObserver(measure) : null;
    if (c) ro!.observe(c);
    return () => ro?.disconnect();
  }, [canvas, selector, part, version]); // version: anything that re-renders the instance (the example tree, the theme) re-measures
  if (!geo || !part) return null;
  const { box, kids } = geo;
  const all: { key: string; property: string; ref: string; axis: Axis; cursor: string; left: number; top: number }[] = [];
  const add = (key: string, candidates: string[], source: Record<string, string | undefined>, axis: Axis, cursor: string, left: number, top: number) => {
    const property = candidates.find((p) => source[p] && stopsFor(source[p]!, tokens));
    if (property) all.push({ key, property, ref: source[property]!, axis, cursor, left, top });
  };
  add("inline", ["padding-inline", "padding"], part.tokens ?? {}, "x", "ew-resize", box.width - 8, box.height / 2 - 8);
  add("block", ["padding-block", "padding"], part.tokens ?? {}, "y", "ns-resize", box.width / 2 - 8, -8);
  add("height", ["height", "min-height"], part.tokens ?? {}, "y", "ns-resize", box.width / 2 - 8, box.height - 8);
  add("radius", ["border-radius"], part.tokens ?? {}, "d", "nwse-resize", -8, -8);
  const column = part.layout?.direction === "column";
  if (kids.length === 2) add("gap", ["gap"], { gap: part.layout?.gap }, column ? "y" : "x", column ? "ns-resize" : "ew-resize", column ? box.width / 2 - 8 : (kids[0]!.right + kids[1]!.left) / 2 - box.x - 8, column ? (kids[0]!.bottom + kids[1]!.top) / 2 - box.y - 8 : box.height / 2 - 8);
  const current = (property: string) => (property === "gap" ? part.layout?.gap : part.tokens?.[property]);
  const down = (h: (typeof all)[number]) => (e: PointerEvent<HTMLButtonElement>) => {
    const scale = stopsFor(h.ref, tokens)!;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { property: h.property, axis: h.axis, x: e.clientX, y: e.clientY, start: scale.current, stops: scale.stops };
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const delta = d.axis === "x" ? e.clientX - d.x : d.axis === "y" ? e.clientY - d.y : (e.clientX - d.x + e.clientY - d.y) / 2;
    const idx = Math.max(0, Math.min(d.stops.length - 1, d.start + Math.round(delta / STEP)));
    const ref = `{${d.stops[idx]!.path}}`;
    if (current(d.property) !== ref) onOp(d.property, ref);
  };
  const up = () => { drag.current = null; };
  const key = (h: (typeof all)[number]) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = ["ArrowRight", "ArrowUp"].includes(e.key) ? 1 : ["ArrowLeft", "ArrowDown"].includes(e.key) ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const scale = stopsFor(h.ref, tokens)!;
    const idx = Math.max(0, Math.min(scale.stops.length - 1, scale.current + dir));
    onOp(h.property, `{${scale.stops[idx]!.path}}`);
  };
  return (
    <>
      {all.map((h) => {
        const scale = stopsFor(h.ref, tokens)!;
        const now = scale.stops[scale.current]!;
        return (
          // ponytail: a native button for now, like the range inputs; a contract when a second canvas needs handles (ADR 0016)
          <button key={h.key} type="button" className="handle" style={{ left: box.x + h.left, top: box.y + h.top, cursor: h.cursor }}
            aria-label={`${h.property}: ${now.label} ${now.value}px. Drag or use the arrow keys to move along the scale.`} title={`${h.property} · ${now.label} ${now.value}px`}
            onPointerDown={down(h)} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key(h)} onClick={(e) => e.stopPropagation()} />
        );
      })}
    </>
  );
}

const Rules = ({ items, kind }: { items: string[]; kind: "do" | "dont" }) => <ul className="rules">{items.map((r) => <li key={r} data-kind={kind}>{r}</li>)}</ul>;

export function ComponentEditor({ ds, contract, catalog, markdown }: { ds: string; contract: Contract; catalog: Catalog; markdown: string; usageHtml?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [draft, setDraft] = useState<Contract>(contract);
  const [baseline, setBaseline] = useState<Contract>(contract); // what the draft holds, updated on save
  const [history, setHistory] = useState<Contract[]>([]); // every operation pushes the contract it replaced; undo pops
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "overview");
  const [editing, setEditing] = useState(params.get("edit") === "1");
  const [showTree, setShowTree] = useState(false);
  const [selected, setSelected] = useState<string>(Object.keys(contract.anatomy)[0]!);
  const [example, setExample] = useState(0);
  const [instance, setInstance] = useState<{ variant?: string; size?: string }>({});
  const [state, setState] = useState<string>("default");
  const [canvasTheme, setCanvasTheme] = useState<"light" | "dark">("dark");
  const [view, setView] = useState({ x: 0, y: 0, z: 1 }); // the stage's translate and scale inside the canvas
  const stageRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const [partAsJson, setPartAsJson] = useState(false);
  const [contractView, setContractView] = useState<"code" | "form">("code");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const canvasRef = useRef<HTMLDivElement>(null);

  const prefix = `${contract.id.replace(/\./g, "-")}__`;
  const modified = useMemo<Catalog>(() => ({ ...catalog, contracts: catalog.contracts.map((c) => (c.id === draft.id ? draft : c)) }), [catalog, draft]);
  const css = useMemo(() => {
    try {
      // Scoped to the canvas: the chrome around it is built from the same contracts and must not light up.
      return emitComponentCss(draft) + (editing ? `\n.cell--on .${partClass(draft.id, selected)} { outline: 2px dashed var(--color-border-focus); outline-offset: 3px; }` : "");
    } catch {
      return "";
    }
  }, [draft, selected, editing]);
  const tokens = catalog.tokens.base;
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const firstEnum = (names: string[]) => draft.props.find((p) => names.includes(p.name) && typeof p.type === "object") as EnumProp | undefined;
  const variantProp = firstEnum(["variant", "tone", "kind"]);
  const sizeProp = firstEnum(["size"]);
  const tree = draft.examples[example]?.tree as Tree | undefined;
  const variants: (string | null)[] = variantProp ? variantProp.type.enum : [null];
  const sizes: (string | null)[] = sizeProp ? sizeProp.type.enum : [null];
  const shown = {
    variant: instance.variant ?? (variantProp ? String(tree?.props?.[variantProp.name] ?? variantProp.default ?? variantProp.type.enum[0]) : ""),
    size: instance.size ?? (sizeProp ? String(tree?.props?.[sizeProp.name] ?? sizeProp.default ?? sizeProp.type.enum[0]) : ""),
  };
  const treeFor = (v: string | null, s: string | null): Tree | undefined => tree && { ...tree, props: { ...tree.props, ...(variantProp && v ? { [variantProp.name]: v } : {}), ...(sizeProp && s ? { [sizeProp.name]: s } : {}), ...(draft.id === "ds.dialog" ? { open: true } : {}) } };
  const shownTree = treeFor(shown.variant || null, shown.size || null);
  const part = findPart(draft.anatomy, selected);
  const rootPart = Object.values(draft.anatomy)[0]!;
  const resolve = (ref: string) => tokens.find((t) => `{${t.path}}` === concrete(ref, shownTree?.props ?? {}))?.value;
  const measures = [...Object.entries(rootPart.tokens ?? {}), ...(rootPart.layout?.gap ? [["gap", rootPart.layout.gap] as [string, string]] : [])]
    .filter(([k]) => /padding|radius|height|gap|width/.test(k))
    .map(([k, v]) => ({ k, v: resolve(v) }))
    .filter((m) => m.v)
    .slice(0, 4);
  const textProp = draft.props.find((p) => p.type === "text" && p.required && typeof tree?.props?.[p.name] === "string");
  const optionalSlots = partList(draft.anatomy).filter(({ part: p }) => p.slot && p.optional && (p.slot.max ?? 2) === 1);

  const change = (next: Contract) => {
    setSaved(false);
    setHistory((h) => [...h.slice(-49), draft]);
    setDraft(next);
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setSaved(false);
    setDraft(prev);
  };
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /^(input|textarea|select)$/i.test(t.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && ["=", "+", "-", "0"].includes(e.key) && !typing) {
        e.preventDefault();
        if (e.key === "0") zoomTo(1);
        else zoomTo(view.z * (e.key === "-" ? 1 / 1.25 : 1.25));
      }
      if (e.shiftKey && e.key === "!" && !typing) {
        e.preventDefault();
        fit();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const pick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const cell = target.closest("[data-cell]") as HTMLElement | null;
    if (cell) setInstance({ variant: cell.dataset.variant || undefined, size: cell.dataset.size || undefined });
    const el = target.closest(`[class*="${prefix}"]`);
    e.preventDefault();
    e.stopPropagation();
    if (!el) return;
    const cls = [...el.classList].find((c) => c.startsWith(prefix));
    if (cls) setSelected(cls.slice(prefix.length));
  };
  /** Scales the set to fit the canvas and centers it. */
  const fit = () => {
    const c = canvasRef.current, st = stageRef.current;
    if (!c || !st) return;
    const w = st.offsetWidth, h = st.offsetHeight;
    const z = Math.min(1, (c.clientWidth - 64) / w, (c.clientHeight - 160) / h);
    setView({ z, x: (c.clientWidth - w * z) / 2, y: (c.clientHeight - h * z) / 2 });
  };
  const zoomTo = (z: number, cx?: number, cy?: number) => {
    const c = canvasRef.current;
    const nz = Math.max(0.25, Math.min(4, z));
    const px = cx ?? (c?.clientWidth ?? 0) / 2, py = cy ?? (c?.clientHeight ?? 0) / 2;
    setView((v) => ({ z: nz, x: px - ((px - v.x) * nz) / v.z, y: py - ((py - v.y) * nz) / v.z }));
  };
  useEffect(() => { if (editing) fit(); }, [editing, example, variants.length, sizes.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !editing) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomTo(view.z * Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top);
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  });
  const panDown = (e: PointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-cell], .handle, button, a, input, select")) return;
    pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const panMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = pan.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.moved) setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const panUp = () => { pan.current = null; };
  const update = (fn: (p: Part) => Part) => change({ ...draft, anatomy: mapPart(draft.anatomy, selected, fn) });
  /** The one operation (ADR 0016): a part, a property, a token reference. gap lives in the part's layout. */
  const operate = (property: string, ref: string) => update((p) => (property === "gap" ? { ...p, layout: { ...p.layout, gap: ref } } : { ...p, tokens: { ...p.tokens, [property]: ref } }));
  /** The instance's own edits go to the example tree, not to the contract's anatomy. */
  const editExample = (fn: (t: Tree) => Tree) => tree && change({ ...draft, examples: draft.examples.map((ex, i) => (i === example ? { ...ex, tree: fn(ex.tree as Tree) as Contract["examples"][number]["tree"] } : ex)) });
  const slotFilled = (name: string) => (tree?.slots?.[name]?.length ?? 0) > 0;
  const toggleSlot = (name: string, p: Part) =>
    editExample((t) => {
      const accepts = p.slot?.accepts?.[0];
      const filler: Node = accepts ? { component: accepts, props: (catalog.contracts.find((c) => c.id === accepts)?.examples[0]?.tree.props ?? {}) as Node["props"] } : { component: "ds.icon", props: { name: "check", size: "sm" } };
      return { ...t, slots: { ...t.slots, [name]: slotFilled(name) ? [] : [filler] } };
    });
  const save = () =>
    start(async () => {
      setError(null);
      const r = await saveContract(ds, draft);
      if (!r.ok) return setError(r.error);
      setBaseline(draft);
      setSaved(true);
      router.refresh();
    });
  const statusTone = draft.status === "stable" ? "success" : draft.status === "deprecated" ? "danger" : "accent";
  const metaLine = [draft.behavior ? `Zag ${draft.behavior}` : `Native ${draft.semantics.element}`, variantProp && `${variantProp.type.enum.length} ${variantProp.name}s`, sizeProp && `${sizeProp.type.enum.length} sizes`].filter(Boolean) as string[];
  const chipNav = (label: string, items: { key: string; label: string; on: boolean; go: () => void }[]) => (
    <Nav label={label} orientation="horizontal" list={items.map((i) => <NavItem key={i.key} href="#" label={i.label} tone="chip" current={i.on} onClick={(e) => { e.preventDefault(); i.go(); }} />)} />
  );
  const listNav = (label: string, items: { key: string; label: string; on: boolean; go: () => void; indent?: number }[]) => (
    <Nav label={label} list={items.map((i) => <NavItem key={i.key} href="#" label={i.label} current={i.on} style={{ marginLeft: (i.indent ?? 0) * 14 }} onClick={(e) => { e.preventDefault(); i.go(); }} />)} />
  );

  // ---------- reading ----------
  const overview = (
    <>
      <div className="grid grid--wide">
        <Card title="Variants" heading="h2" meta={chipNav("Show", [{ key: "p", label: "Preview", on: !showTree, go: () => setShowTree(false) }, { key: "t", label: "Tree", on: showTree, go: () => setShowTree(true) }])}>
          <Stack gap="md">
            {showTree ? (
              <pre className="code">{JSON.stringify(tree, null, 2)}</pre>
            ) : (
              <div className="canvas">
                {tree ? (
                  <Stack gap="lg" align="center">
                    {variantProp && <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "center", flexWrap: "wrap" }}>{variantProp.type.enum.map((v) => <Render key={v} tree={treeFor(v, null)!} />)}</Stack>}
                    {sizeProp && <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "center", flexWrap: "wrap" }}>{sizeProp.type.enum.map((v) => <Render key={v} tree={treeFor(null, v)!} />)}</Stack>}
                    {!variantProp && !sizeProp && <Render tree={shownTree!} />}
                  </Stack>
                ) : (
                  <Text tone="secondary" text={`No standalone example; it renders inside ${draft.relationships.within.map((w) => w.replace("ds.", "")).join(", ")}.`} />
                )}
              </div>
            )}
            {variantProp && (
              <div className="vrule">
                {variantProp.type.enum.map((v) => (
                  <Stack key={v} gap="xs">
                    <Text as="span" variant="label" text={cap(v)} />
                    <Text variant="caption" tone="secondary" text={v === variantProp.default ? "The default." : `${variantProp.name}="${v}"`} />
                  </Stack>
                ))}
              </div>
            )}
          </Stack>
        </Card>
        <Card title="Channels" heading="h2">
          <Table body={Object.entries(draft.channels).map(([ch, s]) => (
            <TableRow key={ch}>
              <TableCell><Stack gap="xs"><Text as="span" variant="label" text={cap(ch)} /><Text as="span" variant="caption" tone="secondary" text={`${s.as ? `as ${s.as}` : s.support}${s.note ? ` · ${s.note}` : ""}`} /></Stack></TableCell>
              <TableCell align="end"><Badge label={cap(s.support)} tone={SUPPORT_TONE[s.support]} /></TableCell>
            </TableRow>
          ))} />
        </Card>
      </div>
      <div className="grid grid--wide">
        <Card title="Anatomy and bindings" heading="h2">
          <Stack gap="md">
            {tree && <div className="anat" inert aria-hidden="true"><Render tree={shownTree!} /></div>}
            <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)" }}>
              <Stack gap="sm">
                {partList(draft.anatomy).map(({ name, part: p, depth }, i) => (
                  <Stack key={name} direction="row" gap="sm" align="start" style={{ paddingLeft: depth * 16 }}>
                    <Badge label={String(i + 1)} tone="accent" />
                    <Stack gap="xs">
                      <Text as="span" variant="label" text={`${name}${p.optional ? " · optional" : ""}${p.slot ? " · slot" : ""}`} />
                      {p.description && <Text variant="caption" tone="secondary" text={p.description} />}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
              <div className="bind">
                {Object.entries(rootPart.tokens ?? {}).map(([prop, ref]) => [
                  <Text key={`${prop}-k`} as="code" variant="code" tone="secondary" text={prop} />,
                  <Text key={`${prop}-v`} as="code" variant="code" text={ref.slice(1, -1)} />,
                ])}
              </div>
            </div>
          </Stack>
        </Card>
        <Card title="Keyboard and focus" heading="h2">
          <Stack gap="sm">
            {draft.a11y.keyboard.length > 0 && (
              <Stack direction="row" gap="sm" align="center" style={{ flexWrap: "wrap" }}>
                {draft.a11y.keyboard.map((k) => <Stack key={k.key} direction="row" gap="xs" align="center"><Text as="code" variant="code" text={k.key} style={{ padding: "2px 7px", borderRadius: "var(--radius-sm)", background: "var(--color-surface-overlay)" }} /><Text as="span" variant="caption" tone="secondary" text={k.action} /></Stack>)}
              </Stack>
            )}
            <ul className="rules">
              {draft.a11y.minHitArea && <li data-kind="do">Hit area at least {draft.a11y.minHitArea}px</li>}
              <li data-kind={draft.a11y.focusVisible ? "do" : "dont"}>{draft.a11y.focusVisible ? "Visible focus ring on color.border.focus" : "No focus ring"}</li>
              <li data-kind="do">{draft.a11y.contrast} contrast in light and dark</li>
            </ul>
          </Stack>
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card><Stack gap="sm"><div><Badge label="Do" tone="success" /></div><Rules items={draft.guidelines.do} kind="do" /></Stack></Card>
        <Card><Stack gap="sm"><div><Badge label="Don't" tone="danger" /></div><Rules items={draft.guidelines.dont} kind="dont" /></Stack></Card>
      </div>
    </>
  );
  const contractPanel = (
    <Card title={`${draft.id.replace("ds.", "")}.contract.json`} heading="h2" meta={chipNav("View", (["code", "form"] as const).map((v) => ({ key: v, label: cap(v), on: contractView === v, go: () => setContractView(v) })))}>
      {contractView === "form" ? (
        <ContractForm draft={draft} onChange={change} />
      ) : (
        <Textarea rows={40} style={mono} aria-label="Contract as JSON" key={JSON.stringify(baseline)} defaultValue={JSON.stringify(draft, null, 2)}
          onBlur={(e) => { try { change(JSON.parse(e.target.value)); setError(null); } catch (err) { setError(`Invalid JSON: ${(err as Error).message}`); } }} />
      )}
    </Card>
  );
  const accessibility = (
    <div className="grid grid--wide">
      <Card title="Accessibility" heading="h2">
        <Stack gap="sm">
          {draft.a11y.keyboard.map((k) => <Stack key={k.key} direction="row" gap="sm" align="center"><Text as="code" variant="code" text={k.key} /><Text as="span" text={k.action} /></Stack>)}
          <ul className="rules">
            {draft.a11y.aria.map((a) => <li key={a} data-kind="do">{a}</li>)}
            <li data-kind="do">{draft.a11y.contrast} contrast in light and dark</li>
            {draft.a11y.minHitArea && <li data-kind="do">Hit area at least {draft.a11y.minHitArea}px</li>}
            <li data-kind={draft.a11y.focusVisible ? "do" : "dont"}>{draft.a11y.focusVisible ? "Focus ring: 2px color.border.focus, 2px offset" : "No focus ring"}</li>
            <li data-kind="do">Every transition and animation stops under prefers-reduced-motion</li>
          </ul>
        </Stack>
      </Card>
      <Card title="Markdown for agents" heading="h2" meta={<CopyButton label="Copy" text={markdown} />}>
        <Text variant="caption" tone="secondary" text="The same guidelines, rendered as the Markdown channel serves them." />
      </Card>
    </div>
  );
  const usage = (
    <>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card title="Use when" heading="h2"><Rules items={draft.usage.when.map(cap)} kind="do" /></Card>
        <Card title="Don't use when" heading="h2"><Rules items={draft.usage.whenNot.map(cap)} kind="dont" /></Card>
      </div>
      {(draft.usage.alternatives.length > 0 || draft.resources.length > 0) && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Card title="Alternatives" heading="h2">
            <Stack gap="xs">
              {draft.usage.alternatives.map((a) => <Stack key={a.component} direction="row" gap="sm" align="center"><Link href={`/${ds}/components/${a.component}`} label={a.component.replace("ds.", "")} /><Text as="span" variant="caption" tone="secondary" text={a.when} /></Stack>)}
              {draft.usage.alternatives.length === 0 && <Text tone="secondary" text="None listed." />}
            </Stack>
          </Card>
          <Card title="Resources" heading="h2">
            <Stack gap="xs">{draft.resources.map((r) => <Link key={r.url} href={r.url} label={r.title} />)}</Stack>
          </Card>
        </div>
      )}
    </>
  );

  // ---------- editing ----------
  const stateBindings = state !== "default" && part ? (part.states as Record<string, Bindings> | undefined)?.[state] : undefined;
  const editor = (
    <div className="ed">
      <div className="pane"><Card padding="lg">
        <Stack gap="md">
          <Stack gap="xs">
            <Text as="span" variant="caption" tone="secondary" text="Parts" />
            {listNav("Parts", partList(draft.anatomy).map(({ name, depth }) => ({ key: name, label: name, on: selected === name, go: () => setSelected(name), indent: depth })))}
          </Stack>
          {(textProp || optionalSlots.length > 0) && (
            <Stack gap="sm">
              <Text as="span" variant="caption" tone="secondary" text="Instance" />
              {textProp && <Field label={cap(textProp.name)}><Input size="sm" value={String(tree?.props?.[textProp.name] ?? "")} onChange={(e) => editExample((t) => ({ ...t, props: { ...t.props, [textProp.name]: e.target.value } }))} /></Field>}
              {optionalSlots.map(({ name, part: p }) => <Checkbox key={name} label={`Show ${name}`} checked={slotFilled(name)} onChange={() => toggleSlot(name, p)} />)}
            </Stack>
          )}
          <Stack gap="xs">
            <Text as="span" variant="caption" tone="secondary" text="State" />
            {listNav("State", ["default", ...draft.states].map((s) => ({ key: s, label: cap(s), on: state === s, go: () => setState(s) })))}
          </Stack>
          {draft.examples.length > 1 && (
            <Field label="Example">
              <Select size="sm" value={String(example)} onChange={(e) => setExample(Number(e.target.value))}>
                {draft.examples.map((ex, i) => <Option key={ex.name} value={String(i)} label={ex.name} />)}
              </Select>
            </Field>
          )}
        </Stack>
      </Card></div>

      <div ref={canvasRef} className={`cv${draft.category === "overlay" ? " cv--overlay" : ""}`} data-theme={canvasTheme} data-preview-state={state === "default" ? undefined : state}
        onClickCapture={(e) => { if (pan.current?.moved) { e.preventDefault(); e.stopPropagation(); return; } pick(e); }} onPointerDown={panDown} onPointerMove={panMove} onPointerUp={panUp} onPointerCancel={panUp} onDoubleClick={fit}>
        <div ref={stageRef} className="stage" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
          {tree ? (
            <div className="cset" style={{ gridTemplateColumns: `repeat(${variants.length}, auto)` }}>
              {sizes.flatMap((sz) => variants.map((v) => {
                const on = (v ?? "") === shown.variant && (sz ?? "") === shown.size;
                return (
                  <div key={`${v}-${sz}`} className={`cell${on ? " cell--on" : ""}`} data-cell data-variant={v ?? ""} data-size={sz ?? ""}>
                    {on && <span className="cell-label">{[v, sz].filter(Boolean).join(" · ") || "default"}</span>}
                    <Render tree={treeFor(v, sz)!} />
                  </div>
                );
              }))}
            </div>
          ) : (
            <div className="cset"><Text tone="secondary" text={`No standalone example; it renders inside ${draft.relationships.within.join(", ")}.`} /></div>
          )}
        </div>
        <Handles canvas={canvasRef} selector={`.cell--on .${partClass(draft.id, selected)}`} part={part} tokens={tokens} onOp={operate} version={[draft, shown, canvasTheme, state, view]} />
        <div className="hud hud-tl">
          <Badge label={`${variants.length * sizes.length} ${variants.length * sizes.length === 1 ? "instance" : "instances"}${state !== "default" ? ` · ${state}` : ""}`} />
          {measures.map((m) => <Badge key={m.k} label={`${m.k} ${m.v}`} />)}
        </div>
        <div className="hud hud-tr">
          {chipNav("Canvas theme", (["light", "dark"] as const).map((t) => ({ key: t, label: cap(t), on: canvasTheme === t, go: () => setCanvasTheme(t) })))}
          <div className="zoom" role="group" aria-label="Zoom">
            <Button label="Zoom out" shape="circle" variant="ghost" size="sm" aria-label="Zoom out (Ctrl and minus)" icon={<Icon name="zoom-out" size="sm" />} onClick={() => zoomTo(view.z / 1.25)} />
            <Select size="sm" value={ZOOMS.includes(Math.round(view.z * 100)) ? String(Math.round(view.z * 100)) : "custom"} aria-label="Zoom level" onChange={(e) => (e.target.value === "fit" ? fit() : e.target.value !== "custom" && zoomTo(Number(e.target.value) / 100))}>
              {!ZOOMS.includes(Math.round(view.z * 100)) && <Option value="custom" label={`${Math.round(view.z * 100)}%`} />}
              {ZOOMS.map((z) => <Option key={z} value={String(z)} label={`${z}%`} />)}
              <Option value="fit" label="Fit" />
            </Select>
            <Button label="Zoom in" shape="circle" variant="ghost" size="sm" aria-label="Zoom in (Ctrl and plus)" icon={<Icon name="zoom-in" size="sm" />} onClick={() => zoomTo(view.z * 1.25)} />
          </div>
        </div>
        <div className="hud hud-bc savebar">
          <Text as="span" variant="label" text={String(history.length)} />
          <Text as="span" variant="caption" text={dirty ? "unsaved changes" : "no changes"} style={{ opacity: 0.8 }} />
          {error && <Text as="span" variant="caption" text={error.split("\n")[0]!} style={{ color: "var(--color-status-danger-foreground)" }} />}
          <Button label="Undo" variant="ghost" size="sm" disabled={history.length === 0} onClick={undo} />
          <Button label="Discard" variant="ghost" size="sm" disabled={!dirty} onClick={() => { change(baseline); setHistory([]); }} />
          <Button label={pending ? "Saving…" : "Save to draft"} size="sm" disabled={!dirty || pending} onClick={save} />
        </div>
      </div>

      <div className="pane"><Card padding="lg">
        <Stack gap="md">
          <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
            <Text as="span" variant="label" text={`${selected}${state !== "default" ? ` · ${state}` : ""}`} style={mono} />
            <Checkbox label="JSON" checked={partAsJson} onChange={(e) => setPartAsJson(e.target.checked)} />
          </Stack>
          {part?.description && <Text variant="caption" tone="secondary" text={`${part.element ?? "div"} · ${part.description}`} />}
          {part && partAsJson ? (
            <Textarea key={selected} rows={22} style={mono} aria-label={`${selected} as JSON`} defaultValue={JSON.stringify(part, null, 2)}
              onBlur={(e) => { try { const p = JSON.parse(e.target.value); setError(null); update(() => p); } catch (err) { setError(`Invalid JSON: ${(err as Error).message}`); } }} />
          ) : part && state === "default" ? (
            <>
              <Sections
                bindings={part.tokens ?? {}}
                tokens={tokens}
                onChange={(t) => update((p) => ({ ...p, tokens: t }))}
                layout={
                  part.layout && (
                    <>
                      <div className="prop">
                        <Text as="code" variant="code" tone="secondary" text="direction" />
                        <Select size="sm" value={part.layout.direction ?? "row"} aria-label="direction" onChange={(e) => update((p) => ({ ...p, layout: { ...p.layout, direction: e.target.value as "row" | "column" } }))}>
                          <Option value="row" label="Row" /><Option value="column" label="Column" />
                        </Select>
                        <span />
                      </div>
                      {part.layout.gap && <PropRow prop="gap" value={part.layout.gap} tokens={tokens} onChange={(ref) => operate("gap", ref)} onRemove={() => update((p) => ({ ...p, layout: { ...p.layout, gap: undefined } }))} />}
                    </>
                  )
                }
              />
              {part.motion && Object.keys(part.motion).length > 0 && (
                <div className="sect">
                  <Text as="span" variant="label" text="Motion" />
                  {Object.entries(part.motion).map(([prop, m]) => (
                    <div key={prop} className="prop">
                      <Text as="code" variant="code" tone="secondary" text={prop} />
                      <Stack direction="row" gap="xs">
                        <Select size="sm" value={m.duration} aria-label={`${prop} duration`} onChange={(e) => update((p) => ({ ...p, motion: { ...p.motion, [prop]: { ...m, duration: e.target.value } } }))}>
                          {tokens.filter((t) => t.path.startsWith("motion.duration.")).map((t) => <Option key={t.path} value={`{${t.path}}`} label={`${t.path.split(".").pop()} ${t.value}`} />)}
                        </Select>
                        <Select size="sm" value={m.easing} aria-label={`${prop} easing`} onChange={(e) => update((p) => ({ ...p, motion: { ...p.motion, [prop]: { ...m, easing: e.target.value } } }))}>
                          {tokens.filter((t) => t.path.startsWith("motion.easing.")).map((t) => <Option key={t.path} value={`{${t.path}}`} label={t.path.split(".").pop()!} />)}
                        </Select>
                      </Stack>
                      <span />
                    </div>
                  ))}
                </div>
              )}
              <div className="sect">
                <Text as="span" variant="label" text="Literal styles" />
                {Object.entries(part.styles ?? {}).map(([k, v]) => (
                  <div key={k} className="prop">
                    <Text as="code" variant="code" tone="secondary" text={k} title={k} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} />
                    <Input size="sm" value={String(v)} aria-label={`${k} style`} style={mono} onChange={(e) => update((p) => ({ ...p, styles: { ...p.styles, [k]: e.target.value } }))} />
                    <Button label="×" variant="ghost" size="sm" aria-label={`Remove ${k}`} onClick={() => update((p) => ({ ...p, styles: Object.fromEntries(Object.entries(p.styles ?? {}).filter(([kk]) => kk !== k)) }))} />
                  </div>
                ))}
                <Input size="sm" list="style-keys" placeholder="add a style key, then Enter" aria-label="New literal style" style={mono}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { const k = (e.target as HTMLInputElement).value.trim(); if (e.key === "Enter" && k) { update((p) => ({ ...p, styles: { ...p.styles, [k]: "" } })); (e.target as HTMLInputElement).value = ""; } }} />
              </div>
            </>
          ) : part ? (
            <>
              <Text variant="caption" tone="secondary" text={stateBindings ? `What changes in the ${state} state. The canvas shows it.` : `No ${state} bindings on this part yet. Add one in a section.`} />
              <Sections bindings={stateBindings ?? {}} tokens={tokens} onChange={(b) => update((p) => ({ ...p, states: { ...p.states, [state]: b } }))} />
            </>
          ) : null}
        </Stack>
      </Card></div>
    </div>
  );

  return (
    <ElosProvider catalog={modified} behaviors={zagBehaviors} elements={elements}>
      <style>{css}</style>
      <datalist id="token-refs">{tokens.map((t) => <option key={t.path} value={`{${t.path}}`} />)}</datalist>
      <datalist id="style-keys">{StyleKey.options.map((k) => <option key={k} value={k} />)}</datalist>

      <PageHead
        title={editing ? `Editing ${draft.name}` : draft.name}
        description={editing ? "Click an instance to pick it and a part to inspect it. Handles and controls write token bindings; nothing writes a pixel." : draft.description}
        crumbs={[{ href: `/${ds}/components`, label: "Components" }, { href: `/${ds}/components?category=${draft.category}`, label: cap(draft.category.replace("-", " ")) }, ...(editing ? [{ href: `/${ds}/components/${draft.id}`, label: draft.name }, { href: "#", label: "Edit" }] : [{ href: `/${ds}/components/${draft.id}`, label: draft.name }])]}
        actions={
          editing ? (
            <Button label="Close" variant="glass" onClick={() => { if (dirty) change(baseline); setEditing(false); }} />
          ) : (
            <>
              <CopyButton label="Copy for agent" text={JSON.stringify(draft, null, 2)} variant="glass" size="md" icon />
              <Button label="Edit" icon={<Icon name="edit" size="sm" />} onClick={() => setEditing(true)} />
            </>
          )
        }
        extras={editing ? undefined : (
          <>
            <Badge label={cap(draft.status)} tone={statusTone} dot />
            <Badge label={`v${draft.version}`} />
            {metaLine.map((m) => <Badge key={m} label={m} />)}
          </>
        )}
        tabs={editing ? undefined : (
          <Nav label="Sections" orientation="horizontal" list={TABS.map((t) => (
            <NavItem key={t} href={`?tab=${t}`} label={cap(t)} tone="bloom" current={tab === t} onClick={(e) => { e.preventDefault(); setTab(t); }} />
          ))} />
        )}
      />
      {editing ? editor : tab === "overview" ? overview : tab === "contract" ? contractPanel : tab === "accessibility" ? accessibility : usage}
    </ElosProvider>
  );
}
