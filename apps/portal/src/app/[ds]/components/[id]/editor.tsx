"use client";
// Component page. Reading: an overview generated from the contract (variants, channels, anatomy and bindings, keyboard, do and don't),
// the contract as code or form, accessibility, usage. Editing: three panes, parts and variants on the left, the canvas in the middle
// with its own theme and size, the inspector on the right where every control writes a token binding and sliders snap to the scale.
// Save validates the whole system on the server before the draft changes.
import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StyleKey, type Catalog, type Contract, type Part } from "@elos/contracts";
import { emitComponentCss, partClass } from "@elos/core/css";
import { ElosProvider, Render } from "@elos/react";
import { zagBehaviors } from "@elos/react/behaviors";
import { Badge, Button, Card, Checkbox, Field, Icon, Input, Link, Nav, NavItem, Option, Select, Stack, Table, TableCell, TableRow, Text, Textarea, elements, options } from "@/components/elos-client.tsx";
import { CopyButton } from "@/components/copy-button.tsx";
import { PageHead } from "@/components/page-head.tsx";
import { saveContract } from "../actions.ts";
import { ContractForm } from "./contract-form.tsx";

type Bindings = Record<string, string>;
type Stop = { path: string; value: number; label: string };
type Tokens = Catalog["tokens"]["base"];
type EnumProp = Contract["props"][number] & { type: { enum: string[] } };
const TABS = ["overview", "contract", "accessibility", "usage"] as const;
type Tab = (typeof TABS)[number];
const STATES = ["hover", "focus-visible", "active", "disabled", "selected", "checked", "open", "invalid"] as const;
const SUPPORT_TONE = { native: "success", degraded: "warning", unsupported: "danger" } as const;
const mono = { fontFamily: "var(--font-family-mono)" } as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
/** Substitutes a prop placeholder with the example's value, so `{space.inset.{size}}` resolves for the shown variant. */
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

type Axis = "x" | "y" | "d";
const HANDLES: { key: string; bindings: string[]; axis: Axis; cursor: string; at: (r: DOMRect) => { left: number; top: number } }[] = [
  { key: "inline", bindings: ["padding-inline", "padding"], axis: "x", cursor: "ew-resize", at: (r) => ({ left: r.width - 8, top: r.height / 2 - 8 }) },
  { key: "block", bindings: ["padding-block", "padding"], axis: "y", cursor: "ns-resize", at: (r) => ({ left: r.width / 2 - 8, top: -8 }) },
  { key: "height", bindings: ["height", "min-height"], axis: "y", cursor: "ns-resize", at: (r) => ({ left: r.width / 2 - 8, top: r.height - 8 }) },
  { key: "radius", bindings: ["border-radius"], axis: "d", cursor: "nwse-resize", at: () => ({ left: -8, top: -8 }) },
];
const STEP = 18; // pixels of drag per stop

/** Handles on the selected part: edges move padding and height, the corner moves radius. Each one walks the token scale,
 *  so a drag lands on a token, never a pixel. The same operation the inspector and, later, the agent produce. */
function Handles({ canvas, selector, part, tokens, onOp }: { canvas: RefObject<HTMLDivElement | null>; selector: string; part: Part | undefined; tokens: Tokens; onOp: (property: string, ref: string) => void }) {
  const [box, setBox] = useState<DOMRect | null>(null);
  const drag = useRef<{ property: string; axis: Axis; x: number; y: number; start: number; stops: Stop[] } | null>(null);
  useEffect(() => {
    const c = canvas.current;
    const measure = () => {
      const el = c?.querySelector(selector) as HTMLElement | null;
      if (!c || !el) return setBox(null);
      const cr = c.getBoundingClientRect(), er = el.getBoundingClientRect();
      setBox(new DOMRect(er.left - cr.left, er.top - cr.top, er.width, er.height));
    };
    measure();
    const ro = c ? new ResizeObserver(measure) : null;
    if (c) ro!.observe(c);
    return () => ro?.disconnect();
  }, [canvas, selector, part]);
  if (!box || !part) return null;
  const handles = HANDLES.flatMap((h) => {
    const property = h.bindings.find((b) => part.tokens?.[b] && stopsFor(part.tokens[b]!, tokens));
    return property ? [{ ...h, property, scale: stopsFor(part.tokens![property]!, tokens)! }] : [];
  });
  const down = (h: (typeof handles)[number]) => (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { property: h.property, axis: h.axis, x: e.clientX, y: e.clientY, start: h.scale.current, stops: h.scale.stops };
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const delta = d.axis === "x" ? e.clientX - d.x : d.axis === "y" ? e.clientY - d.y : (e.clientX - d.x + e.clientY - d.y) / 2;
    const idx = Math.max(0, Math.min(d.stops.length - 1, d.start + Math.round(delta / STEP)));
    const ref = `{${d.stops[idx]!.path}}`;
    if (part.tokens?.[d.property] !== ref) onOp(d.property, ref);
  };
  const up = () => { drag.current = null; };
  const key = (h: (typeof handles)[number]) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = ["ArrowRight", "ArrowUp"].includes(e.key) ? 1 : ["ArrowLeft", "ArrowDown"].includes(e.key) ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const idx = Math.max(0, Math.min(h.scale.stops.length - 1, h.scale.current + dir));
    onOp(h.property, `{${h.scale.stops[idx]!.path}}`);
  };
  return (
    <>
      {handles.map((h) => {
        const { left, top } = h.at(box);
        const now = h.scale.stops[h.scale.current]!;
        return (
          // ponytail: a native button for now, like the range inputs; a contract when a second canvas needs handles (ADR 0016)
          <button key={h.key} type="button" className="handle" style={{ left: box.x + left, top: box.y + top, cursor: h.cursor }}
            aria-label={`${h.property}: ${now.label} ${now.value}px. Drag or use the arrow keys to move along the ${h.property.includes("radius") ? "radius" : "spacing"} scale.`}
            title={`${h.property} · ${now.label} ${now.value}px`}
            onPointerDown={down(h)} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key(h)} onClick={(e) => e.stopPropagation()} />
        );
      })}
    </>
  );
}

/** One binding row: the token name as an input with completion; a swatch for colors; a slider for dimensions. */
function BindingRow({ prop, value, tokens, catalog, onChange, onRemove }: { prop: string; value: string; tokens: Tokens; catalog: Catalog; onChange: (ref: string) => void; onRemove: () => void }) {
  const resolved = catalog.tokens.base.find((t) => `{${t.path}}` === value);
  return (
    <Stack gap="xs">
      <Stack direction="row" gap="xs" align="center">
        <Text as="code" variant="code" tone="secondary" text={prop} style={{ width: 110, flex: "none", overflow: "hidden", textOverflow: "ellipsis" }} />
        {resolved?.type === "color" && <span style={{ width: 14, height: 14, borderRadius: 4, flex: "none", background: resolved.value, boxShadow: "inset 0 0 0 1px var(--color-border-default)" }} />}
        <Input size="sm" list="token-refs" value={value} placeholder="{token.path}" aria-label={`${prop} binding`} onChange={(e) => onChange(e.target.value)} style={mono} />
        <Button label="×" variant="ghost" size="sm" aria-label={`Remove ${prop}`} onClick={onRemove} />
      </Stack>
      <ScaleSlider label={prop} tokenRef={value} tokens={tokens} onPick={onChange} />
    </Stack>
  );
}

/** Key/value rows for token bindings or literal styles. */
function Rows({ label, bindings, onChange, keyList, tokens, catalog }: { label: string; bindings: Bindings; onChange: (b: Bindings) => void; keyList?: string; tokens: Tokens; catalog: Catalog }) {
  const entries = Object.entries(bindings);
  const rename = (i: number, key: string) => onChange(Object.fromEntries(entries.map(([k, v], j) => (j === i ? [key, v] : [k, v]))));
  return (
    <Stack gap="sm">
      <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
        <Text as="span" variant="label" text={label} />
        <Button label="Add" variant="ghost" size="sm" onClick={() => onChange({ ...bindings, "": "" })} />
      </Stack>
      {entries.map(([k, v], i) =>
        keyList || k === "" ? (
          <Stack key={i} direction="row" gap="xs" align="center">
            <div style={{ width: 110, flex: "none" }}><Input size="sm" list={keyList} value={k} placeholder="property" aria-label={`${label} property`} onChange={(e) => rename(i, e.target.value)} style={mono} /></div>
            <Input size="sm" list={keyList ? undefined : "token-refs"} value={v} placeholder={keyList ? "value" : "{token.path}"} aria-label={`${label} value`} onChange={(e) => onChange({ ...bindings, [k]: e.target.value })} style={mono} />
            <Button label="×" variant="ghost" size="sm" aria-label={`Remove ${k || "row"}`} onClick={() => onChange(Object.fromEntries(entries.filter((_, j) => j !== i)))} />
          </Stack>
        ) : (
          <BindingRow key={k} prop={k} value={v} tokens={tokens} catalog={catalog} onChange={(ref) => onChange({ ...bindings, [k]: ref })} onRemove={() => onChange(Object.fromEntries(entries.filter((_, j) => j !== i)))} />
        ),
      )}
      {entries.length === 0 && <Text as="span" variant="caption" tone="tertiary" text="None." />}
    </Stack>
  );
}

const Rules = ({ items, kind }: { items: string[]; kind: "do" | "dont" }) => <ul className="rules">{items.map((r) => <li key={r} data-kind={kind}>{r}</li>)}</ul>;

export function ComponentEditor({ ds, contract, catalog, markdown }: { ds: string; contract: Contract; catalog: Catalog; markdown: string; usageHtml?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [draft, setDraft] = useState<Contract>(contract);
  const [baseline, setBaseline] = useState<Contract>(contract); // what the draft holds, updated on save
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "overview");
  const [editing, setEditing] = useState(params.get("edit") === "1");
  const [showTree, setShowTree] = useState(false);
  const [selected, setSelected] = useState<string>(Object.keys(contract.anatomy)[0]!);
  const [example, setExample] = useState(0);
  const [variant, setVariant] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [canvasTheme, setCanvasTheme] = useState<"light" | "dark">("dark");
  const [partAsJson, setPartAsJson] = useState(false);
  const [contractView, setContractView] = useState<"code" | "form">("code");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<Contract[]>([]); // every operation pushes the contract it replaced; undo pops
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();

  const prefix = `${contract.id.replace(/\./g, "-")}__`;
  const modified = useMemo<Catalog>(() => ({ ...catalog, contracts: catalog.contracts.map((c) => (c.id === draft.id ? draft : c)) }), [catalog, draft]);
  const css = useMemo(() => {
    try {
      // Scoped to the canvas: the chrome around it is built from the same contracts and must not light up.
      return emitComponentCss(draft) + (editing ? `\n.cv .${partClass(draft.id, selected)} { outline: 2px dashed var(--color-border-focus); outline-offset: 3px; }` : "");
    } catch {
      return "";
    }
  }, [draft, selected, editing]);
  const tokens = catalog.tokens.base;
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const changedCount = useMemo(() => {
    const flat = (c: Contract) => Object.fromEntries(partList(c.anatomy).flatMap(({ name, part }) => Object.entries({ ...part.tokens, ...part.styles, ...Object.fromEntries(Object.entries(part.states ?? {}).flatMap(([s, b]) => Object.entries(b).map(([k, v]) => [`${s} ${k}`, v]))) }).map(([k, v]) => [`${name} ${k}`, v])));
    const a = flat(draft), b = flat(baseline);
    return new Set([...Object.keys(a), ...Object.keys(b)]).size - Object.keys(a).filter((k) => a[k] === b[k]).length;
  }, [draft, baseline]);

  const firstEnum = (names: string[]) => draft.props.find((p) => names.includes(p.name) && typeof p.type === "object") as EnumProp | undefined;
  const variantProp = firstEnum(["variant", "tone", "kind"]);
  const sizeProp = firstEnum(["size"]);
  const tree = draft.examples[example]?.tree;
  const shownProps = { ...tree?.props, ...(variantProp && variant ? { [variantProp.name]: variant } : {}), ...(sizeProp && size ? { [sizeProp.name]: size } : {}) };
  const shownTree = tree && { ...tree, props: { ...shownProps, ...(draft.id === "ds.dialog" ? { open: true } : {}) } };
  const withProp = (name: string, value: string) => tree && { ...tree, props: { ...tree.props, [name]: value } };
  const part = findPart(draft.anatomy, selected);
  const rootPart = Object.values(draft.anatomy)[0]!;
  const resolve = (ref: string) => tokens.find((t) => `{${t.path}}` === concrete(ref, shownProps))?.value;
  const measures = Object.entries(rootPart.tokens ?? {})
    .filter(([k]) => /padding|radius|height|gap|width/.test(k))
    .map(([k, v]) => ({ k, v: resolve(v) }))
    .filter((m) => m.v)
    .slice(0, 3);

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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/^(input|textarea|select)$/i.test(t.tagName)) {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const pick = (e: MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest(`[class*="${prefix}"]`);
    e.preventDefault();
    e.stopPropagation();
    if (!el) return;
    const cls = [...el.classList].find((c) => c.startsWith(prefix));
    if (cls) setSelected(cls.slice(prefix.length));
  };
  const update = (fn: (p: Part) => Part) => change({ ...draft, anatomy: mapPart(draft.anatomy, selected, fn) });
  /** The one operation (ADR 0016): a part, a property, a token reference. */
  const operate = (property: string, ref: string) => update((p) => ({ ...p, tokens: { ...p.tokens, [property]: ref } }));
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

  // ---------- reading ----------
  const overview = (
    <>
      <div className="grid grid--wide">
        <Card title="Variants" heading="h2" meta={
          <Nav label="Show" orientation="horizontal" list={[
            <NavItem key="p" href="#" label="Preview" tone="chip" current={!showTree} onClick={(e) => { e.preventDefault(); setShowTree(false); }} />,
            <NavItem key="t" href="#" label="Tree" tone="chip" current={showTree} onClick={(e) => { e.preventDefault(); setShowTree(true); }} />,
          ]} />
        }>
          <Stack gap="md">
            {showTree ? (
              <pre className="code">{JSON.stringify(tree, null, 2)}</pre>
            ) : (
              <div className="canvas">
                {tree ? (
                  <Stack gap="lg" align="center">
                    {variantProp && <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "center", flexWrap: "wrap" }}>{variantProp.type.enum.map((v) => <Render key={v} tree={withProp(variantProp.name, v)!} />)}</Stack>}
                    {sizeProp && <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "center", flexWrap: "wrap" }}>{sizeProp.type.enum.map((v) => <Render key={v} tree={withProp(sizeProp.name, v)!} />)}</Stack>}
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
    <Card title={`${draft.id.replace("ds.", "")}.contract.json`} heading="h2" meta={
      <Nav label="View" orientation="horizontal" list={(["code", "form"] as const).map((v) => <NavItem key={v} href="#" label={cap(v)} tone="chip" current={contractView === v} onClick={(e) => { e.preventDefault(); setContractView(v); }} />)} />
    }>
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
  const editor = (
    <div className="ed">
      <div className="pane"><Card padding="lg">
        <Stack gap="md">
          <Stack gap="xs">
            <Text as="span" variant="caption" tone="secondary" text="Parts" />
            <Nav label="Parts" list={partList(draft.anatomy).map(({ name, depth }) => (
              <NavItem key={name} href="#" label={name} current={selected === name} style={{ marginLeft: depth * 14, ...mono }} onClick={(e) => { e.preventDefault(); setSelected(name); }} />
            ))} />
          </Stack>
          {variantProp && (
            <Stack gap="xs">
              <Text as="span" variant="caption" tone="secondary" text={cap(variantProp.name)} />
              <Nav label={variantProp.name} list={variantProp.type.enum.map((v) => (
                <NavItem key={v} href="#" label={cap(v)} current={(variant ?? String(tree?.props?.[variantProp.name] ?? variantProp.default)) === v} onClick={(e) => { e.preventDefault(); setVariant(v); }} />
              ))} />
            </Stack>
          )}
          {draft.examples.length > 1 && (
            <Field label="Example">
              <Select size="sm" value={String(example)} onChange={(e) => setExample(Number(e.target.value))}>
                {draft.examples.map((ex, i) => <Option key={ex.name} value={String(i)} label={ex.name} />)}
              </Select>
            </Field>
          )}
        </Stack>
      </Card></div>

      <Stack gap="md">
        <Card padding="lg">
          <Stack gap="sm">
            <div className="cv-top">
              {sizeProp && (
                <Nav label="Size" orientation="horizontal" list={sizeProp.type.enum.map((v) => (
                  <NavItem key={v} href="#" label={v} tone="chip" current={(size ?? String(tree?.props?.[sizeProp.name] ?? sizeProp.default)) === v} onClick={(e) => { e.preventDefault(); setSize(v); }} />
                ))} />
              )}
              <span style={{ flex: 1 }} />
              <Nav label="Canvas theme" orientation="horizontal" list={(["light", "dark"] as const).map((t) => (
                <NavItem key={t} href="#" label={cap(t)} tone="chip" current={canvasTheme === t} onClick={(e) => { e.preventDefault(); setCanvasTheme(t); }} />
              ))} />
            </div>
            <div ref={canvasRef} className={`canvas cv${draft.category === "overlay" ? " canvas--overlay" : ""}`} data-theme={canvasTheme} onClickCapture={pick} style={{ cursor: "crosshair" }}>
              {shownTree ? <Render tree={shownTree} /> : <Text tone="secondary" text={`No standalone example; it renders inside ${draft.relationships.within.join(", ")}.`} />}
              <Handles canvas={canvasRef} selector={`.${partClass(draft.id, selected)}`} part={part} tokens={tokens} onOp={operate} />
              {measures.length > 0 && (
                <div className="measure">{measures.map((m) => <Badge key={m.k} label={`${m.k} ${m.v}`} tone="neutral" />)}</div>
              )}
            </div>
          </Stack>
        </Card>
        <div className="savebar">
          <Text as="span" variant="label" text={String(changedCount)} />
          <Text as="span" variant="caption" text={dirty ? "unsaved changes to the draft" : "no unsaved changes"} style={{ opacity: 0.8 }} />
          <span style={{ flex: 1 }} />
          {error && <Text as="span" variant="caption" text={error.split("\n")[0]!} style={{ color: "var(--color-status-danger-foreground)" }} />}
          <Button label="Undo" variant="ghost" size="sm" disabled={history.length === 0} onClick={undo} />
          <Button label="Discard" variant="ghost" size="sm" disabled={!dirty} onClick={() => change(baseline)} />
          <Button label={pending ? "Saving…" : "Save to draft"} size="sm" disabled={!dirty || pending} onClick={save} />
        </div>
      </Stack>

      <div className="pane"><Card padding="lg">
        <Stack gap="md">
          <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
            <Text as="span" variant="label" text={`${selected}${variantProp && variant ? ` · ${variant}` : ""}`} style={mono} />
            <Checkbox label="JSON" checked={partAsJson} onChange={(e) => setPartAsJson(e.target.checked)} />
          </Stack>
          {part?.description && <Text variant="caption" tone="secondary" text={`${part.element ?? "div"} · ${part.description}`} />}
          {part && partAsJson ? (
            <Textarea key={selected} rows={22} style={mono} aria-label={`${selected} as JSON`} defaultValue={JSON.stringify(part, null, 2)}
              onBlur={(e) => { try { const p = JSON.parse(e.target.value); setError(null); update(() => p); } catch (err) { setError(`Invalid JSON: ${(err as Error).message}`); } }} />
          ) : part ? (
            <>
              <Rows label="Token bindings" bindings={part.tokens ?? {}} tokens={tokens} catalog={catalog} onChange={(t) => update((p) => ({ ...p, tokens: t }))} />
              {Object.entries(part.states ?? {}).map(([state, b]) => (
                <Rows key={state} label={`State: ${state}`} bindings={b} tokens={tokens} catalog={catalog} onChange={(nb) => update((p) => ({ ...p, states: { ...p.states, [state]: nb } }))} />
              ))}
              <Field label="Add state">
                <Select size="sm" value="" onChange={(e) => e.target.value && update((p) => ({ ...p, states: { ...p.states, [e.target.value]: {} } }))}>
                  <Option value="" label="Choose a state" />
                  {STATES.filter((s) => !(part.states && s in part.states)).map((s) => <Option key={s} value={s} label={s} />)}
                </Select>
              </Field>
              {part.motion && Object.keys(part.motion).length > 0 && (
                <Stack gap="sm">
                  <Text as="span" variant="label" text="Motion" />
                  {Object.entries(part.motion).map(([prop, m]) => (
                    <Stack key={prop} gap="xs">
                      <Text as="code" variant="code" tone="secondary" text={prop} />
                      <Stack direction="row" gap="xs">
                        <Select size="sm" value={m.duration} aria-label={`${prop} duration`} onChange={(e) => update((p) => ({ ...p, motion: { ...p.motion, [prop]: { ...m, duration: e.target.value } } }))}>
                          {tokens.filter((t) => t.path.startsWith("motion.duration.")).map((t) => <Option key={t.path} value={`{${t.path}}`} label={`${t.path.split(".").pop()} ${t.value}`} />)}
                        </Select>
                        <Select size="sm" value={m.easing} aria-label={`${prop} easing`} onChange={(e) => update((p) => ({ ...p, motion: { ...p.motion, [prop]: { ...m, easing: e.target.value } } }))}>
                          {tokens.filter((t) => t.path.startsWith("motion.easing.")).map((t) => <Option key={t.path} value={`{${t.path}}`} label={t.path.split(".").pop()!} />)}
                        </Select>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
              <Rows label="Literal styles" bindings={(part.styles ?? {}) as Bindings} tokens={tokens} catalog={catalog} onChange={(styles) => update((p) => ({ ...p, styles }))} keyList="style-keys" />
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
        description={editing ? "Every control writes a token binding to the contract. Sliders snap to the scale." : draft.description}
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
