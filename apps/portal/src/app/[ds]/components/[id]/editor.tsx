"use client";
// Component editor. Preview tab: click a part in the live preview to select it and edit its bindings and
// styles, or switch the panel to JSON. Contract tab: the contract as a form, or as code. Every edit
// re-renders from the modified contract; Save validates the whole system on the server before the draft changes.
import { useMemo, useState, useTransition, type MouseEvent } from "react";
import { StyleKey, type Catalog, type Contract, type Part } from "@elos/contracts";
import { emitComponentCss, partClass } from "@elos/core/css";
import { ElosProvider, Render } from "@elos/react";
import { zagBehaviors } from "@elos/react/behaviors";
import { Badge } from "@/components/elos-client.tsx";
import { saveContract } from "../actions.ts";
import { ContractForm } from "./contract-form.tsx";

type Bindings = Record<string, string>;
const STATES = ["hover", "focus-visible", "active", "disabled", "selected", "checked", "open", "invalid"] as const;

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

/** Key/value rows for token bindings or literal styles. Defined at module level so React keeps the inputs mounted between keystrokes. */
function Rows({ label, bindings, onChange, keyList }: { label: string; bindings: Bindings; onChange: (b: Bindings) => void; keyList?: string }) {
  const entries = Object.entries(bindings);
  const rename = (i: number, key: string) => onChange(Object.fromEntries(entries.map(([k, v], j) => (j === i ? [key, v] : [k, v]))));
  return (
    <div className="field">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span>{label}</span>
        <button type="button" className="ds-button__root" data-variant="ghost" data-size="sm" onClick={() => onChange({ ...bindings, "": "" })}>
          <span className="ds-button__label">Add</span>
        </button>
      </div>
      {entries.map(([k, v], i) => (
        <div key={i} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
          <input list={keyList} value={k} placeholder="css property" style={{ width: 130 }} onChange={(e) => rename(i, e.target.value)} />
          <input list={keyList ? undefined : "token-refs"} value={v} placeholder={keyList ? "value" : "{token.path}"} style={{ flex: 1 }} onChange={(e) => onChange({ ...bindings, [k]: e.target.value })} />
          <button type="button" className="ds-button__root" data-variant="ghost" data-size="sm" aria-label="Remove" onClick={() => onChange(Object.fromEntries(entries.filter((_, j) => j !== i)))}>
            <span className="ds-button__label">×</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function ComponentEditor({ ds, contract, catalog, usageHtml }: { ds: string; contract: Contract; catalog: Catalog; usageHtml: string }) {
  const [draft, setDraft] = useState<Contract>(contract);
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
      return emitComponentCss(draft) + (selected ? `\n.${partClass(draft.id, selected)} { outline: 2px dashed var(--color-border-focus); outline-offset: 3px; }` : "");
    } catch {
      return "";
    }
  }, [draft, selected]);
  const tokenPaths = useMemo(() => catalog.tokens.base.map((t) => t.path), [catalog]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(contract);
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
      setSaved(true);
    });

  const previewPanel = (
    <div className="editor">
      <div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            Example
            <select value={example} onChange={(e) => setExample(Number(e.target.value))}>
              {draft.examples.map((ex, i) => <option key={ex.name} value={i}>{ex.name}</option>)}
            </select>
          </label>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={selectMode} onChange={(e) => setSelectMode(e.target.checked)} /> Select parts
          </label>
        </div>
        <div className={`canvas${draft.category === "overlay" ? " canvas--overlay" : ""}`} onClickCapture={pick} style={{ cursor: selectMode ? "crosshair" : undefined }}>
          {previewTree ? <Render tree={previewTree} /> : <span className="muted">This component has no standalone example; it renders inside {draft.relationships.within.join(", ")}.</span>}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Parts:{" "}
          {partNames(draft.anatomy).map((n) => (
            <button key={n} type="button" onClick={() => setSelected(n)} style={{ font: "inherit", background: "none", border: 0, padding: "0 6px", cursor: "pointer", color: n === selected ? "var(--color-text-primary)" : "inherit", textDecoration: n === selected ? "underline" : "none" }}>{n}</button>
          ))}
        </p>
      </div>

      <aside className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {part && selected ? (
          <>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>{selected}</h2>
              <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={partAsJson} onChange={(e) => setPartAsJson(e.target.checked)} /> JSON
              </label>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}><code>{part.element ?? "div"}</code>{part.description ? ` · ${part.description}` : ""}</p>
            {partAsJson ? (
              <textarea className="field" rows={18} style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }} defaultValue={JSON.stringify(part, null, 2)} key={selected}
                onBlur={(e) => { try { const p = JSON.parse(e.target.value); setError(null); update(() => p); } catch (err) { setError(`Invalid JSON: ${(err as Error).message}`); } }} />
            ) : (
              <>
                <Rows label="Token bindings" bindings={part.tokens ?? {}} onChange={(tokens) => update((p) => ({ ...p, tokens }))} />
                {Object.entries(part.states ?? {}).map(([state, b]) => (
                  <Rows key={state} label={`State: ${state}`} bindings={b} onChange={(nb) => update((p) => ({ ...p, states: { ...p.states, [state]: nb } }))} />
                ))}
                <label className="field">
                  Add state
                  <select value="" onChange={(e) => e.target.value && update((p) => ({ ...p, states: { ...p.states, [e.target.value]: {} } }))}>
                    <option value="">…</option>
                    {STATES.filter((s) => !(part.states && s in part.states)).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <Rows label="Literal styles" bindings={(part.styles ?? {}) as Bindings} onChange={(styles) => update((p) => ({ ...p, styles }))} keyList="style-keys" />
              </>
            )}
          </>
        ) : (
          <>
            <h2 style={{ margin: 0 }}>Anatomy</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>Click a part in the preview, or pick one from the list under it, to edit its token bindings, states and styles. Props, usage and guidelines are on the Contract tab.</p>
          </>
        )}
        {error && <div className="error">{error}</div>}
      </aside>
    </div>
  );

  const contractPanel = (
    <div>
      <div className="row" style={{ justifyContent: "flex-end", marginBottom: 10 }}>
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          View
          <select value={contractView} onChange={(e) => setContractView(e.target.value as "form" | "code")}><option value="form">form</option><option value="code">code</option></select>
        </label>
      </div>
      {contractView === "form" ? (
        <ContractForm draft={draft} onChange={change} />
      ) : (
        <textarea className="field panel" rows={40} style={{ width: "100%", fontFamily: "ui-monospace, monospace", fontSize: 12 }} key={JSON.stringify(contract)} defaultValue={JSON.stringify(draft, null, 2)}
          onBlur={(e) => { try { change(JSON.parse(e.target.value)); setError(null); } catch (err) { setError(`Invalid JSON: ${(err as Error).message}`); } }} />
      )}
      {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );

  return (
    <ElosProvider catalog={modified} behaviors={zagBehaviors}>
      <style>{css}</style>
      <datalist id="token-refs">{tokenPaths.map((p) => <option key={p} value={`{${p}}`} />)}</datalist>
      <datalist id="style-keys">{StyleKey.options.map((k) => <option key={k} value={k} />)}</datalist>

      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div className="row">
          <h1 style={{ margin: 0 }}>{draft.name}</h1>
          <Badge label={draft.status} tone={draft.status === "stable" ? "success" : draft.status === "deprecated" ? "danger" : "neutral"} />
          <code className="muted">{draft.id}</code>
        </div>
        <div className="row">
          {error && <span className="error">{error.split("\n")[0]}</span>}
          {saved && !dirty && <span className="muted" style={{ fontSize: 13 }}>Saved.</span>}
          {dirty && (
            <button type="button" className="ds-button__root" data-variant="ghost" data-size="md" onClick={() => change(contract)}>
              <span className="ds-button__label">Discard</span>
            </button>
          )}
          <button type="button" className="ds-button__root" data-variant="primary" data-size="md" disabled={!dirty || pending} onClick={save}>
            <span className="ds-button__label">{pending ? "Saving…" : "Save to draft"}</span>
          </button>
        </div>
      </div>

      <Render
        tree={{
          component: "ds.tabs",
          props: { defaultValue: "preview" },
          slots: {
            list: [
              { component: "ds.tab", props: { value: "preview", label: "Preview" } },
              { component: "ds.tab", props: { value: "contract", label: "Contract" } },
              { component: "ds.tab", props: { value: "usage", label: "Usage" } },
            ],
            panels: [
              { component: "ds.tab-panel", props: { value: "preview" }, slots: { root: [<div key="p">{previewPanel}</div>] } },
              { component: "ds.tab-panel", props: { value: "contract" }, slots: { root: [<div key="c">{contractPanel}</div>] } },
              { component: "ds.tab-panel", props: { value: "usage" }, slots: { root: [<div key="u" className="panel prose" dangerouslySetInnerHTML={{ __html: usageHtml }} />] } },
            ],
          },
        }}
      />
    </ElosProvider>
  );
}
