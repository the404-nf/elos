"use client";
// The contract as a form. Lists are one item per line; anatomy is edited on the canvas, not here.
import { Category, Channel, type Contract } from "@elos/contracts";

type Prop = Contract["props"][number];
const lines = (xs: string[]) => xs.join("\n");
const unlines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function Lines({ label, value, onChange, rows = 3, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; rows?: number; hint?: string }) {
  return (
    <label className="field">
      {label}{hint && <span style={{ fontSize: 12 }}> · {hint}</span>}
      <textarea rows={rows} defaultValue={lines(value)} onBlur={(e) => onChange(unlines(e.target.value))} />
    </label>
  );
}

export function ContractForm({ draft, onChange }: { draft: Contract; onChange: (c: Contract) => void }) {
  const set = <K extends keyof Contract>(k: K, v: Contract[K]) => onChange({ ...draft, [k]: v });
  const setProp = (i: number, p: Partial<Prop>) => set("props", draft.props.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const propType = (p: Prop) => (typeof p.type === "object" ? "enum" : p.type);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <h3>Identity</h3>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <label className="field" style={{ flex: 1 }}>Name<input value={draft.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className="field">Status
            <select value={draft.status} onChange={(e) => set("status", e.target.value as Contract["status"])}>
              <option>draft</option><option>stable</option><option>deprecated</option>
            </select>
          </label>
          <label className="field">Category
            <select value={draft.category} onChange={(e) => set("category", e.target.value as Contract["category"])}>
              {Category.options.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">Version<input value={draft.version} onChange={(e) => set("version", e.target.value)} style={{ width: 90 }} /></label>
        </div>
        <label className="field">Description<textarea rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} /></label>
        <div className="row">
          <label className="field">Element<input value={draft.semantics.element} onChange={(e) => set("semantics", { ...draft.semantics, element: e.target.value })} style={{ width: 120 }} /></label>
          <label className="field">Role<input value={draft.semantics.role ?? ""} onChange={(e) => set("semantics", { ...draft.semantics, role: e.target.value || undefined })} style={{ width: 120 }} /></label>
          <label className="field">Behavior<input value={draft.behavior ?? ""} placeholder="none" onChange={(e) => set("behavior", e.target.value || undefined)} style={{ width: 140 }} /></label>
        </div>
      </section>

      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Props</h3>
          <button type="button" className="ds-button__root" data-variant="secondary" data-size="sm"
            onClick={() => set("props", [...draft.props, { name: "", description: "", type: "text", required: false }])}>
            <span className="ds-button__label">Add prop</span>
          </button>
        </div>
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Values / attribute</th><th>Default</th><th>Req.</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {draft.props.map((p, i) => (
              <tr key={i}>
                <td><input className="field" value={p.name} onChange={(e) => setProp(i, { name: e.target.value })} style={{ width: 110 }} /></td>
                <td>
                  <select value={propType(p)} onChange={(e) => setProp(i, { type: e.target.value === "enum" ? { enum: ["a", "b"] } : (e.target.value as "text" | "boolean" | "number"), default: undefined })}>
                    <option>text</option><option>boolean</option><option>number</option><option>enum</option>
                  </select>
                </td>
                <td>
                  {typeof p.type === "object" ? (
                    <input value={p.type.enum.join(", ")} onChange={(e) => setProp(i, { type: { enum: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } })} placeholder="a, b, c" style={{ width: 160 }} />
                  ) : (
                    <input value={p.attribute ?? ""} onChange={(e) => setProp(i, { attribute: e.target.value || undefined })} placeholder="html attribute" style={{ width: 160 }} />
                  )}
                </td>
                <td>
                  {p.type === "boolean" ? (
                    <input type="checkbox" checked={p.default === true} onChange={(e) => setProp(i, { default: e.target.checked })} />
                  ) : (
                    <input value={p.default === undefined ? "" : String(p.default)} onChange={(e) => setProp(i, { default: e.target.value === "" ? undefined : p.type === "number" ? Number(e.target.value) : e.target.value })} style={{ width: 80 }} />
                  )}
                </td>
                <td><input type="checkbox" checked={p.required} onChange={(e) => setProp(i, { required: e.target.checked })} /></td>
                <td><input value={p.description} onChange={(e) => setProp(i, { description: e.target.value })} style={{ width: "100%" }} /></td>
                <td>
                  <button type="button" className="ds-button__root" data-variant="ghost" data-size="sm" aria-label="Remove prop" onClick={() => set("props", draft.props.filter((_, j) => j !== i))}>
                    <span className="ds-button__label">×</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <h3>Usage</h3>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>Short, enumerable statements. Agents match on these words, so write the words people use.</p>
        <Lines label="When to use" value={draft.usage.when} onChange={(v) => set("usage", { ...draft.usage, when: v })} />
        <Lines label="When not to use" value={draft.usage.whenNot} onChange={(v) => set("usage", { ...draft.usage, whenNot: v })} />
        <Lines label="Intents" value={draft.usage.intents} onChange={(v) => set("usage", { ...draft.usage, intents: v })} rows={2} hint="verbs and nouns an agent would search for" />
        <Lines label="Use instead" value={draft.usage.alternatives.map((a) => `${a.component}: ${a.when}`)} rows={2} hint="ds.id: when"
          onChange={(v) => set("usage", { ...draft.usage, alternatives: v.map((l) => { const [component, ...rest] = l.split(":"); return { component: component!.trim(), when: rest.join(":").trim() }; }) })} />
      </section>

      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <h3>Guidelines</h3>
        <Lines label="Do" value={draft.guidelines.do} onChange={(v) => set("guidelines", { ...draft.guidelines, do: v })} />
        <Lines label="Don't" value={draft.guidelines.dont} onChange={(v) => set("guidelines", { ...draft.guidelines, dont: v })} />
      </section>

      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <h3>Accessibility</h3>
        <div className="row">
          <label className="field">Contrast
            <select value={draft.a11y.contrast} onChange={(e) => set("a11y", { ...draft.a11y, contrast: e.target.value as "AA" | "AAA" })}><option>AA</option><option>AAA</option></select>
          </label>
          <label className="field">Min hit area (px)<input type="number" value={draft.a11y.minHitArea ?? ""} onChange={(e) => set("a11y", { ...draft.a11y, minHitArea: e.target.value ? Number(e.target.value) : undefined })} style={{ width: 90 }} /></label>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end" }}>
            <input type="checkbox" checked={draft.a11y.focusVisible} onChange={(e) => set("a11y", { ...draft.a11y, focusVisible: e.target.checked })} /> Visible focus
          </label>
        </div>
        <Lines label="Keyboard" value={draft.a11y.keyboard.map((k) => `${k.key}: ${k.action}`)} rows={2} hint="Key: action"
          onChange={(v) => set("a11y", { ...draft.a11y, keyboard: v.map((l) => { const [key, ...rest] = l.split(":"); return { key: key!.trim(), action: rest.join(":").trim() }; }) })} />
        <Lines label="ARIA notes" value={draft.a11y.aria} onChange={(v) => set("a11y", { ...draft.a11y, aria: v })} rows={2} />
      </section>

      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <h3>Relationships</h3>
        <div className="row" style={{ alignItems: "flex-start" }}>
          {(["pairsWith", "contains", "within", "excludes"] as const).map((k) => (
            <label key={k} className="field" style={{ flex: 1 }}>{k}
              <input value={draft.relationships[k].join(", ")} placeholder="ds.a, ds.b" onChange={(e) => set("relationships", { ...draft.relationships, [k]: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
            </label>
          ))}
        </div>
      </section>

      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <h3>Channels</h3>
        <table className="table">
          <thead><tr><th>Channel</th><th>Support</th><th>Becomes</th><th>Note</th></tr></thead>
          <tbody>
            {Channel.options.map((ch) => {
              const s = draft.channels[ch] ?? { support: "unsupported" as const };
              const setCh = (patch: Partial<typeof s>) => set("channels", { ...draft.channels, [ch]: { ...s, ...patch } });
              return (
                <tr key={ch}>
                  <td>{ch}</td>
                  <td>
                    <select value={s.support} onChange={(e) => setCh({ support: e.target.value as typeof s.support })}>
                      <option>native</option><option>degraded</option><option>unsupported</option>
                    </select>
                  </td>
                  <td><input value={s.as ?? ""} onChange={(e) => setCh({ as: e.target.value || undefined })} style={{ width: "100%" }} /></td>
                  <td><input value={s.note ?? ""} onChange={(e) => setCh({ note: e.target.value || undefined })} style={{ width: "100%" }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
