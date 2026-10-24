"use client";
// Component editor. Preview tab: click a part in the live preview to select it and edit its bindings and
// styles, or switch the panel to JSON. Contract tab: the contract as a form, or as code. Every edit
// re-renders from the modified contract; Save validates the whole system on the server before the draft changes.
import { useMemo, useState, useTransition, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StyleKey, type Catalog, type Contract, type Part } from "@elos/contracts";
import { emitComponentCss, partClass } from "@elos/core/css";
import { ElosProvider, Render } from "@elos/react";
import { zagBehaviors } from "@elos/react/behaviors";
import { Badge, Button, Card, Checkbox, Field, Icon, Input, Nav, NavItem, Option, Select, Stack, Table, TableCell, TableRow, Text, Textarea, elements, options } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";
import { saveContract } from "../actions.ts";
import { ContractForm } from "./contract-form.tsx";

type Bindings = Record<string, string>;
type Stop = { path: string; value: number; label: string };
const TABS = ["overview", "contract", "accessibility", "usage"] as const;
type Tab = (typeof TABS)[number];
const STATES = ["hover", "focus-visible", "active", "disabled", "selected", "checked", "open", "invalid"] as const;
const SUPPORT_TONE = { native: "success", degraded: "warning", unsupported: "danger" } as const;
const mono = { fontFamily: "var(--font-family-mono)" } as const;

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
const partNames = (anatomy: Record<string, Part>): string[] => Object.entries(anatomy).flatMap(([n, p]) => [n, ...(p.parts ? partNames(p.parts) : [])]);

/** The dimension tokens a binding can snap to: the siblings of the bound token, one stop per value, sorted. */
function stopsFor(ref: string, tokens: Catalog["tokens"]["base"]): { current: number; stops: Stop[] } | null {
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

/** A range that snaps a dimension binding to the stops of its scale, the way the approved inspector does. */
function ScaleSlider({ label, tokenRef, tokens, onPick }: { label: string; tokenRef: string; tokens: Catalog["tokens"]["base"]; onPick: (ref: string) => void }) {
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

/** Key/value rows for token bindings or literal styles. Defined at module level so React keeps the inputs mounted between keystrokes. */
function Rows({ label, bindings, onChange, keyList, tokens }: { label: string; bindings: Bindings; onChange: (b: Bindings) => void; keyList?: string; tokens?: Catalog["tokens"]["base"] }) {
  const entries = Object.entries(bindings);
  const rename = (i: number, key: string) => onChange(Object.fromEntries(entries.map(([k, v], j) => (j === i ? [key, v] : [k, v]))));
  return (
    <Stack gap="xs">
      <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
        <Text as="span" variant="caption" text={label} style={{ fontWeight: "var(--font-weight-medium)" }} />
        <Button label="Add" variant="ghost" size="sm" onClick={() => onChange({ ...bindings, "": "" })} />
      </Stack>
      {entries.map(([k, v], i) => (
        <Stack key={i} gap="xs">
          <Stack direction="row" gap="xs" align="center">
          <div style={{ width: 130, flex: "none" }}>
            <Input size="sm" list={keyList} value={k} placeholder="css property" aria-label={`${label} property`} onChange={(e) => rename(i, e.target.value)} />
          </div>
          <Input size="sm" list={keyList ? undefined : "token-refs"} value={v} placeholder={keyList ? "value" : "{token.path}"} aria-label={`${label} value`} onChange={(e) => onChange({ ...bindings, [k]: e.target.value })} />
          <Button label="×" variant="ghost" size="sm" aria-label={`Remove ${k || "row"}`} onClick={() => onChange(Object.fromEntries(entries.filter((_, j) => j !== i)))} />
          </Stack>
          {tokens && <ScaleSlider label={k} tokenRef={v} tokens={tokens} onPick={(ref) => onChange({ ...bindings, [k]: ref })} />}
        </Stack>
      ))}
      {entries.length === 0 && <Text as="span" variant="caption" tone="secondary" text="None." />}
    </Stack>
  );
}

/** Usage lines and guidelines that mention a value used by the example (variant names, prop values, prop names). */
function rulesFor(c: Contract, tree: { props?: Record<string, unknown> } | undefined) {
  const words = new Set([...Object.values(tree?.props ?? {}).map((v) => String(v).toLowerCase()), ...Object.keys(tree?.props ?? {}).map((k) => k.toLowerCase())]);
  const hit = (s: string) => [...words].some((w) => w.length > 2 && new RegExp(`\\b${w}\\b`, "i").test(s));
  const pick = (lines: string[], kind: string) => lines.filter(hit).map((text) => ({ text, kind }));
  const specific = [...pick(c.usage.whenNot, "dont"), ...pick(c.guidelines.dont, "dont"), ...pick(c.usage.when, "do"), ...pick(c.guidelines.do, "do")];
  return specific.length ? specific.slice(0, 5) : [...c.guidelines.do.slice(0, 1).map((text) => ({ text, kind: "do" })), ...c.guidelines.dont.slice(0, 1).map((text) => ({ text, kind: "dont" }))];
}

function CopyButton({ label, text, variant = "ghost", size = "sm" }: { label: string; text: string; variant?: "ghost" | "glass"; size?: "sm" | "md" }) {
  const [done, setDone] = useState(false);
  return <Button label={done ? "Copied" : label} variant={variant} size={size} onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })} />;
}

export function ComponentEditor({ ds, contract, catalog, markdown, usageHtml }: { ds: string; contract: Contract; catalog: Catalog; markdown: string; usageHtml: string }) {
  const [draft, setDraft] = useState<Contract>(contract);
  const [showTree, setShowTree] = useState(false);
  const [baseline, setBaseline] = useState<Contract>(contract); // what the draft holds, updated on save
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "overview");
  const [editing, setEditing] = useState(params.get("edit") === "1");
  const [selected, setSelected] = useState<string | null>(null);
  const [example, setExample] = useState(0);
  const [selectMode, setSelectMode] = useState(true);
  const [partAsJson, setPartAsJson] = useState(false);
  const [contractView, setContractView] = useState<"form" | "code">("form");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const prefix = `${contract.id.replace(/\./g, "-")}__`;
  const modified = useMemo<Catalog>(() => ({ ...catalog, contracts: catalog.contracts.map((c) => (c.id === draft.id ? draft : c)) }), [catalog, draft]);
  const css = useMemo(() => {
    try {
      // Scoped to the canvas: the chrome around it is built from the same contracts and must not light up.
      return emitComponentCss(draft) + (selected ? `\n.canvas .${partClass(draft.id, selected)} { outline: 2px dashed var(--color-border-focus); outline-offset: 3px; }` : "");
    } catch {
      return "";
    }
  }, [draft, selected]);
  const tokenPaths = useMemo(() => catalog.tokens.base.map((t) => t.path), [catalog]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const tree = draft.examples[example]?.tree;
  const previewTree = tree && draft.id === "ds.dialog" ? { ...tree, props: { ...tree.props, open: true } } : tree;
  const part = selected ? findPart(draft.anatomy, selected) : undefined;

  const change = (next: Contract) => {
    setSaved(false);
    setDraft(next);
  };
  const pick = (e: MouseEvent<HTMLDivElement>) => {
    if (!selectMode) return;
    const el = (e.target as HTMLElement).closest(`[class*="${prefix}"]`);
    e.preventDefault();
    e.stopPropagation();
    if (!el) return setSelected(null);
    const cls = [...el.classList].find((c) => c.startsWith(prefix));
    setSelected(cls ? cls.slice(prefix.length) : null);
  };
  const update = (fn: (p: Part) => Part) => selected && change({ ...draft, anatomy: mapPart(draft.anatomy, selected, fn) });
  const save = () =>
    start(async () => {
      setError(null);
      const r = await saveContract(ds, draft);
      if (!r.ok) return setError(r.error);
      setBaseline(draft);
      setSaved(true);
      router.refresh();
    });

  const firstEnum = (names: string[]) => draft.props.find((p) => names.includes(p.name) && typeof p.type === "object") as (Contract["props"][number] & { type: { enum: string[] } }) | undefined;
  const variantProp = firstEnum(["variant", "tone", "kind"]);
  const sizeProp = firstEnum(["size"]);
  const withProp = (name: string, value: string) => tree && { ...tree, props: { ...tree.props, [name]: value } };
  const rootPart = Object.values(draft.anatomy)[0]!;
  const partList = (anatomy: Record<string, Part>, depth = 0): { name: string; part: Part; depth: number }[] =>
    Object.entries(anatomy).flatMap(([name, part]) => [{ name, part, depth }, ...(part.parts ? partList(part.parts, depth + 1) : [])]);
  const Rules = ({ items, kind }: { items: string[]; kind: "do" | "dont" }) => (
    <ul className="rules">{items.map((r) => <li key={r} data-kind={kind}>{r}</li>)}</ul>
  );
  const overviewPanel = (
    <>
      <div className="grid grid--wide">
        <Card title="Variants" heading="h2">
          <Stack gap="md">
            <div className="canvas">
              {previewTree ? (
                <Stack gap="md" align="center">
                  {variantProp && <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "center", flexWrap: "wrap" }}>{variantProp.type.enum.map((v) => <Render key={v} tree={withProp(variantProp.name, v)!} />)}</Stack>}
                  {sizeProp && <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "center", flexWrap: "wrap" }}>{sizeProp.type.enum.map((v) => <Render key={v} tree={withProp(sizeProp.name, v)!} />)}</Stack>}
                  {!variantProp && !sizeProp && <Render tree={previewTree} />}
                </Stack>
              ) : (
                <Text tone="secondary" text={`This component has no standalone example; it renders inside ${draft.relationships.within.join(", ")}.`} />
              )}
            </div>
            {(variantProp || sizeProp) && (
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {[variantProp, sizeProp].filter(Boolean).map((p) => (
                  <Stack key={p!.name} gap="xs">
                    <Text as="span" variant="label" text={p!.name} />
                    <Text variant="caption" tone="secondary" text={`${p!.description} Values: ${p!.type.enum.join(", ")}. Default ${String(p!.default)}.`} />
                  </Stack>
                ))}
              </div>
            )}
            {tree && (
              <Stack direction="row" gap="xs" style={{ justifyContent: "flex-end" }}>
                <Button label={showTree ? "Hide tree" : "Tree"} variant="ghost" size="sm" onClick={() => setShowTree(!showTree)} />
                <CopyButton label="Copy tree" text={JSON.stringify(tree, null, 2)} />
                <CopyButton label="Copy guidelines" text={markdown} />
              </Stack>
            )}
            {showTree && tree && <pre className="code">{JSON.stringify(tree, null, 2)}</pre>}
          </Stack>
        </Card>
        <Card title="Channels" heading="h2">
          <Table caption="Channel support" body={Object.entries(draft.channels).map(([ch, s]) => (
            <TableRow key={ch}>
              <TableCell><Stack gap="xs"><Text as="span" variant="label" text={ch} /><Text as="span" variant="caption" tone="secondary" text={`${s.as ? `as ${s.as}` : s.support}${s.note ? ` · ${s.note}` : ""}`} /></Stack></TableCell>
              <TableCell align="end"><Badge label={s.support} tone={SUPPORT_TONE[s.support]} /></TableCell>
            </TableRow>
          ))} />
        </Card>
      </div>
      <div className="grid grid--wide">
        <Card title="Anatomy and bindings" heading="h2">
          <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)" }}>
            <Stack gap="sm">
              {partList(draft.anatomy).map(({ name, part, depth }, i) => (
                <Stack key={name} direction="row" gap="sm" align="start" style={{ paddingLeft: depth * 16 }}>
                  <Badge label={String(i + 1)} tone="accent" />
                  <Stack gap="xs">
                    <Text as="span" variant="label" text={`${name}${part.optional ? " · optional" : ""}${part.slot ? " · slot" : ""}`} />
                    {part.description && <Text variant="caption" tone="secondary" text={part.description} />}
                  </Stack>
                </Stack>
              ))}
            </Stack>
            <Table caption="Root token bindings" body={Object.entries(rootPart.tokens ?? {}).map(([prop, ref]) => (
              <TableRow key={prop}>
                <TableCell><Text as="code" variant="code" tone="secondary" text={prop} /></TableCell>
                <TableCell align="end"><Text as="code" variant="code" text={ref} /></TableCell>
              </TableRow>
            ))} />
          </div>
        </Card>
        <Card title="Keyboard and focus" heading="h2">
          <Stack gap="xs">
            {draft.a11y.keyboard.map((k) => <Stack key={k.key} direction="row" gap="sm" align="center"><Text as="code" variant="code" text={k.key} /><Text as="span" variant="caption" tone="secondary" text={k.action} /></Stack>)}
            <ul className="rules">
              {draft.a11y.minHitArea && <li data-kind="do">Hit area at least {draft.a11y.minHitArea}px</li>}
              <li data-kind={draft.a11y.focusVisible ? "do" : "dont"}>{draft.a11y.focusVisible ? "Visible focus ring on color.border.focus" : "No focus ring"}</li>
              <li data-kind="do">{draft.a11y.contrast} contrast in light and dark</li>
            </ul>
          </Stack>
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card heading="h2" title="Do"><Rules items={[...draft.guidelines.do, ...draft.usage.when.map((w) => `Use it when ${w}`)]} kind="do" /></Card>
        <Card heading="h2" title="Don't"><Rules items={[...draft.guidelines.dont, ...draft.usage.whenNot.map((w) => `Not for ${w}`)]} kind="dont" /></Card>
      </div>
    </>
  );
  const accessibilityPanel = (
    <div className="grid grid--wide">
      <Card title="Keyboard and ARIA" heading="h2">
        <Stack gap="sm">
          {draft.a11y.keyboard.length === 0 && <Text tone="secondary" text="Not interactive: no keyboard map." />}
          {draft.a11y.keyboard.map((k) => <Stack key={k.key} direction="row" gap="sm" align="center"><Text as="code" variant="code" text={k.key} /><Text as="span" text={k.action} /></Stack>)}
          <ul className="rules">{draft.a11y.aria.map((a) => <li key={a} data-kind="do">{a}</li>)}</ul>
        </Stack>
      </Card>
      <Card title="Targets" heading="h2">
        <ul className="rules">
          <li data-kind="do">{draft.a11y.contrast} contrast in light and dark</li>
          {draft.a11y.minHitArea && <li data-kind="do">Hit area at least {draft.a11y.minHitArea}px</li>}
          <li data-kind={draft.a11y.focusVisible ? "do" : "dont"}>{draft.a11y.focusVisible ? "Focus ring: 2px color.border.focus, 2px offset" : "No focus ring"}</li>
          <li data-kind="do">Every transition and animation stops under prefers-reduced-motion</li>
        </ul>
      </Card>
    </div>
  );

  const previewPanel = (
    <div className="editor">
      <Card title="Canvas" heading="h2">
      <Stack gap="sm">
        <Stack direction="row" gap="md" align="end" style={{ justifyContent: "space-between" }}>
          <Field label="Example">
            <Select size="sm" value={String(example)} onChange={(e) => setExample(Number(e.target.value))}>
              {draft.examples.map((ex, i) => <Option key={ex.name} value={String(i)} label={ex.name} />)}
            </Select>
          </Field>
          <Checkbox label="Select parts" checked={selectMode} onChange={(e) => setSelectMode(e.target.checked)} />
        </Stack>
        <div className={`canvas${draft.category === "overlay" ? " canvas--overlay" : ""}`} onClickCapture={pick} style={{ cursor: selectMode ? "crosshair" : undefined }}>
          {previewTree ? <Render tree={previewTree} /> : <Text tone="secondary" text={`This component has no standalone example; it renders inside ${draft.relationships.within.join(", ")}.`} />}
        </div>
        {tree && (
          <>
            <Stack direction="row" gap="md" align="start" style={{ justifyContent: "space-between" }}>
              <ul className="rules">
                {rulesFor(draft, tree).map((r) => <li key={r.text} data-kind={r.kind}>{r.text}</li>)}
              </ul>
              <Stack direction="row" gap="xs">
                <Button label={showTree ? "Hide tree" : "Tree"} variant="ghost" size="sm" onClick={() => setShowTree(!showTree)} />
                <CopyButton label="Copy tree" text={JSON.stringify(tree, null, 2)} />
                <CopyButton label="Copy contract" text={JSON.stringify(draft, null, 2)} />
                <CopyButton label="Copy guidelines" text={markdown} />
              </Stack>
            </Stack>
            {showTree && <pre className="code">{JSON.stringify(tree, null, 2)}</pre>}
          </>
        )}
        <Stack direction="row" gap="xs" align="center">
          <Text as="span" variant="caption" tone="secondary" text="Parts" />
          {partNames(draft.anatomy).map((n) => (
            <Button key={n} label={n} size="sm" variant={n === selected ? "secondary" : "ghost"} aria-pressed={n === selected} onClick={() => setSelected(n)} />
          ))}
        </Stack>
      </Stack>
      </Card>

      <aside>
        <Card title={part && selected ? selected : "Anatomy and bindings"} heading="h2">
          <Stack gap="md">
            {part && selected ? (
              <>
                <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                  <Text variant="caption" tone="secondary" text={`${part.element ?? "div"}${part.description ? ` · ${part.description}` : ""}`} />
                  <Checkbox label="JSON" checked={partAsJson} onChange={(e) => setPartAsJson(e.target.checked)} />
                </Stack>
                {partAsJson ? (
                  <Textarea key={selected} rows={18} style={mono} aria-label={`${selected} as JSON`} defaultValue={JSON.stringify(part, null, 2)}
                    onBlur={(e) => { try { const p = JSON.parse(e.target.value); setError(null); update(() => p); } catch (err) { setError(`Invalid JSON: ${(err as Error).message}`); } }} />
                ) : (
                  <>
                    <Rows label="Token bindings" bindings={part.tokens ?? {}} tokens={catalog.tokens.base} onChange={(tokens) => update((p) => ({ ...p, tokens }))} />
                    {Object.entries(part.states ?? {}).map(([state, b]) => (
                      <Rows key={state} label={`State: ${state}`} bindings={b} onChange={(nb) => update((p) => ({ ...p, states: { ...p.states, [state]: nb } }))} />
                    ))}
                    <Field label="Add state">
                      <Select size="sm" value="" onChange={(e) => e.target.value && update((p) => ({ ...p, states: { ...p.states, [e.target.value]: {} } }))}>
                        <Option value="" label="Choose a state" />
                        {STATES.filter((s) => !(part.states && s in part.states)).map((s) => <Option key={s} value={s} label={s} />)}
                      </Select>
                    </Field>
                    <Rows label="Literal styles" bindings={(part.styles ?? {}) as Bindings} onChange={(styles) => update((p) => ({ ...p, styles }))} keyList="style-keys" />
                  </>
                )}
              </>
            ) : (
              <Text variant="caption" tone="secondary" text="Click a part in the preview, or pick one from the list under it, to edit its token bindings, states and styles. Dimension bindings get a slider that snaps to the scale. Props, usage and guidelines are on the Contract tab." />
            )}
            {error && <div className="error">{error}</div>}
          </Stack>
        </Card>
        <Card title="Channels" heading="h2">
          <Table caption="Channel support" body={Object.entries(draft.channels).map(([ch, s]) => (
            <TableRow key={ch}>
              <TableCell><Stack gap="xs"><Text as="span" variant="label" text={ch} /><Text as="span" variant="caption" tone="secondary" text={`${s.as ? `as ${s.as}` : s.support}${s.note ? ` · ${s.note}` : ""}`} /></Stack></TableCell>
              <TableCell align="end"><Badge label={s.support} tone={SUPPORT_TONE[s.support]} /></TableCell>
            </TableRow>
          ))} />
        </Card>
        <Card title="Keyboard and focus" heading="h2">
          <Stack gap="xs">
            {draft.a11y.keyboard.map((k) => <Stack key={k.key} direction="row" gap="sm" align="center"><Text as="code" variant="code" text={k.key} /><Text as="span" variant="caption" tone="secondary" text={k.action} /></Stack>)}
            <ul className="rules">
              <li data-kind={draft.a11y.focusVisible ? "do" : "dont"}>{draft.a11y.focusVisible ? "Visible focus ring on color.border.focus" : "No focus ring"}</li>
              {draft.a11y.minHitArea && <li data-kind="do">Hit area at least {draft.a11y.minHitArea}px</li>}
              <li data-kind="do">{draft.a11y.contrast} contrast in dark and light</li>
              {draft.a11y.aria.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </Stack>
        </Card>
      </aside>
    </div>
  );

  const contractPanel = (
    <Stack gap="md">
      <Stack direction="row" gap="sm" style={{ justifyContent: "flex-end" }}>
        <Field label="View">
          <Select size="sm" value={contractView} onChange={(e) => setContractView(e.target.value as "form" | "code")}>{options(["form", "code"])}</Select>
        </Field>
      </Stack>
      {contractView === "form" ? (
        <ContractForm draft={draft} onChange={change} />
      ) : (
        <Textarea rows={40} style={mono} aria-label="Contract as JSON" key={JSON.stringify(baseline)} defaultValue={JSON.stringify(draft, null, 2)}
          onBlur={(e) => { try { change(JSON.parse(e.target.value)); setError(null); } catch (err) { setError(`Invalid JSON: ${(err as Error).message}`); } }} />
      )}
      {error && <div className="error">{error}</div>}
    </Stack>
  );

  return (
    <ElosProvider catalog={modified} behaviors={zagBehaviors} elements={elements}>
      <style>{css}</style>
      <datalist id="token-refs">{tokenPaths.map((p) => <option key={p} value={`{${p}}`} />)}</datalist>
      <datalist id="style-keys">{StyleKey.options.map((k) => <option key={k} value={k} />)}</datalist>

      <PageHead
        title={editing ? `Editing ${draft.name}` : draft.name}
        description={editing ? "Every control writes a token binding to the contract. Sliders snap to the scale." : draft.description}
        crumbs={[{ href: `/${ds}/components`, label: "Components" }, { href: `/${ds}/components/${draft.id}`, label: draft.name }, ...(editing ? [{ href: `/${ds}/components/${draft.id}?edit=1`, label: "Edit" }] : [])]}
        actions={
          editing ? (
            <>
              <Button label={dirty ? "Discard" : "Close"} variant="glass" onClick={() => { if (dirty) change(baseline); else setEditing(false); }} />
              <Button label={pending ? "Saving…" : !dirty && saved ? "Saved" : "Save to draft"} disabled={!dirty || pending} onClick={save} />
            </>
          ) : (
            <>
              <CopyButton label="Copy for agent" text={JSON.stringify(draft, null, 2)} variant="glass" size="md" />
              <Button label="Edit" icon={<Icon name="edit" size="sm" />} onClick={() => setEditing(true)} />
            </>
          )
        }
        extras={
          <>
            <Badge label={draft.status} tone={draft.status === "stable" ? "success" : draft.status === "deprecated" ? "danger" : "accent"} dot />
            <Text as="code" variant="code" text={`v${draft.version}`} />
            <Text as="code" variant="code" text={draft.id} />
            <Text as="span" variant="caption" text={[draft.behavior ? `Zag ${draft.behavior}` : `native ${draft.semantics.element}`, variantProp && `${variantProp.type.enum.length} ${variantProp.name}s`, sizeProp && `${sizeProp.type.enum.length} sizes`].filter(Boolean).join(" · ")} style={{ opacity: 0.85 }} />
            {error && <span className="error">{error.split("\n")[0]}</span>}
          </>
        }
        tabs={editing ? undefined : (
          <Nav label="Sections" orientation="horizontal" list={TABS.map((t) => (
            <NavItem key={t} href={`?tab=${t}`} label={t.charAt(0).toUpperCase() + t.slice(1)} tone="bloom" current={tab === t} onClick={(e) => { e.preventDefault(); setTab(t); }} />
          ))} />
        )}
      />
      {editing ? previewPanel : tab === "overview" ? overviewPanel : tab === "contract" ? contractPanel : tab === "accessibility" ? accessibilityPanel : <Card padding="xl"><div className="prose" dangerouslySetInnerHTML={{ __html: usageHtml }} /></Card>}
    </ElosProvider>
  );
}
