"use client";
// The contract as a form. Lists are one item per line; anatomy is edited on the canvas, not here.
import { Category, Channel, type Contract } from "@elos/contracts";
import { Button, Card, Checkbox, Field, Input, Select, Stack, Table, TableCell, TableRow, Text, Textarea, options } from "@/components/elos-client.tsx";

type Prop = Contract["props"][number];
const lines = (xs: string[]) => xs.join("\n");
const unlines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function Lines({ label, value, onChange, rows = 3, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; rows?: number; hint?: string }) {
  return (
    <Field label={label} help={hint}>
      <Textarea rows={rows} defaultValue={lines(value)} onBlur={(e) => onChange(unlines(e.target.value))} />
    </Field>
  );
}

export function ContractForm({ draft, onChange }: { draft: Contract; onChange: (c: Contract) => void }) {
  const set = <K extends keyof Contract>(k: K, v: Contract[K]) => onChange({ ...draft, [k]: v });
  const setProp = (i: number, p: Partial<Prop>) => set("props", draft.props.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const propType = (p: Prop) => (typeof p.type === "object" ? "enum" : p.type);

  return (
    <Stack gap="lg">
      <Card heading="h2" title="Identity">
        <Stack gap="md">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 200 }}><Field label="Name"><Input value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
            <Field label="Status">
              <Select value={draft.status} onChange={(e) => set("status", e.target.value as Contract["status"])}>{options(["draft", "stable", "deprecated"])}</Select>
            </Field>
            <Field label="Category">
              <Select value={draft.category} onChange={(e) => set("category", e.target.value as Contract["category"])}>{options(Category.options)}</Select>
            </Field>
            <div style={{ width: 110 }}><Field label="Version"><Input value={draft.version} onChange={(e) => set("version", e.target.value)} /></Field></div>
          </div>
          <Field label="Description"><Textarea rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div style={{ width: 140 }}><Field label="Element"><Input value={draft.semantics.element} onChange={(e) => set("semantics", { ...draft.semantics, element: e.target.value })} /></Field></div>
            <div style={{ width: 140 }}><Field label="Role"><Input value={draft.semantics.role ?? ""} onChange={(e) => set("semantics", { ...draft.semantics, role: e.target.value || undefined })} /></Field></div>
            <div style={{ width: 160 }}><Field label="Behavior" help="none for static components"><Input value={draft.behavior ?? ""} onChange={(e) => set("behavior", e.target.value || undefined)} /></Field></div>
          </div>
        </Stack>
      </Card>

      <Card heading="h2" title="Props" actions={<Button label="Add prop" variant="secondary" size="sm" onClick={() => set("props", [...draft.props, { name: "", description: "", type: "text", required: false }])} />}>
        <div className="scroll-x">
          <Table
            caption="Props of the contract"
            head={<TableRow><TableCell as="th">Name</TableCell><TableCell as="th">Type</TableCell><TableCell as="th">Values or attribute</TableCell><TableCell as="th">Default</TableCell><TableCell as="th">Required</TableCell><TableCell as="th">Description</TableCell><TableCell as="th"> </TableCell></TableRow>}
            body={draft.props.map((p, i) => (
              <TableRow key={i}>
                <TableCell><div style={{ width: 120 }}><Input size="sm" value={p.name} aria-label="Prop name" onChange={(e) => setProp(i, { name: e.target.value })} /></div></TableCell>
                <TableCell>
                  <Select size="sm" value={propType(p)} aria-label="Prop type" onChange={(e) => setProp(i, { type: e.target.value === "enum" ? { enum: ["a", "b"] } : (e.target.value as "text" | "boolean" | "number"), default: undefined })}>
                    {options(["text", "boolean", "number", "enum"])}
                  </Select>
                </TableCell>
                <TableCell>
                  <div style={{ width: 170 }}>
                    {typeof p.type === "object" ? (
                      <Input size="sm" value={p.type.enum.join(", ")} placeholder="a, b, c" aria-label="Enum values" onChange={(e) => setProp(i, { type: { enum: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } })} />
                    ) : (
                      <Input size="sm" value={p.attribute ?? ""} placeholder="html attribute" aria-label="HTML attribute" onChange={(e) => setProp(i, { attribute: e.target.value || undefined })} />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {p.type === "boolean" ? (
                    <Checkbox label="" aria-label="Default on" checked={p.default === true} onChange={(e) => setProp(i, { default: e.target.checked })} />
                  ) : (
                    <div style={{ width: 90 }}><Input size="sm" value={p.default === undefined ? "" : String(p.default)} aria-label="Default value" onChange={(e) => setProp(i, { default: e.target.value === "" ? undefined : p.type === "number" ? Number(e.target.value) : e.target.value })} /></div>
                  )}
                </TableCell>
                <TableCell><Checkbox label="" aria-label="Required" checked={p.required} onChange={(e) => setProp(i, { required: e.target.checked })} /></TableCell>
                <TableCell><div style={{ minWidth: 200 }}><Input size="sm" value={p.description} aria-label="Prop description" onChange={(e) => setProp(i, { description: e.target.value })} /></div></TableCell>
                <TableCell align="end"><Button label="×" variant="ghost" size="sm" aria-label={`Remove prop ${p.name}`} onClick={() => set("props", draft.props.filter((_, j) => j !== i))} /></TableCell>
              </TableRow>
            ))}
          />
        </div>
      </Card>

      <Card heading="h2" title="Usage">
        <Stack gap="md">
          <Text variant="caption" tone="secondary" text="Short, enumerable statements. Agents match on these words, so write the words people use." />
          <Lines label="When to use" value={draft.usage.when} onChange={(v) => set("usage", { ...draft.usage, when: v })} />
          <Lines label="When not to use" value={draft.usage.whenNot} onChange={(v) => set("usage", { ...draft.usage, whenNot: v })} />
          <Lines label="Intents" value={draft.usage.intents} onChange={(v) => set("usage", { ...draft.usage, intents: v })} rows={2} hint="Verbs and nouns an agent would search for, one per line." />
          <Lines label="Use instead" value={draft.usage.alternatives.map((a) => `${a.component}: ${a.when}`)} rows={2} hint="One per line as ds.id: when."
            onChange={(v) => set("usage", { ...draft.usage, alternatives: v.map((l) => { const [component, ...rest] = l.split(":"); return { component: component!.trim(), when: rest.join(":").trim() }; }) })} />
        </Stack>
      </Card>

      <Card heading="h2" title="Guidelines">
        <Stack gap="md">
          <Lines label="Do" value={draft.guidelines.do} onChange={(v) => set("guidelines", { ...draft.guidelines, do: v })} />
          <Lines label="Don't" value={draft.guidelines.dont} onChange={(v) => set("guidelines", { ...draft.guidelines, dont: v })} />
        </Stack>
      </Card>

      <Card heading="h2" title="Accessibility">
        <Stack gap="md">
          <div className="row" style={{ alignItems: "flex-end" }}>
            <Field label="Contrast">
              <Select value={draft.a11y.contrast} onChange={(e) => set("a11y", { ...draft.a11y, contrast: e.target.value as "AA" | "AAA" })}>{options(["AA", "AAA"], { AA: "AA", AAA: "AAA" })}</Select>
            </Field>
            <div style={{ width: 140 }}>
              <Field label="Min hit area (px)"><Input type="number" value={draft.a11y.minHitArea === undefined ? "" : String(draft.a11y.minHitArea)} onChange={(e) => set("a11y", { ...draft.a11y, minHitArea: e.target.value ? Number(e.target.value) : undefined })} /></Field>
            </div>
            <Checkbox label="Visible focus" checked={draft.a11y.focusVisible} onChange={(e) => set("a11y", { ...draft.a11y, focusVisible: e.target.checked })} />
          </div>
          <Lines label="Keyboard" value={draft.a11y.keyboard.map((k) => `${k.key}: ${k.action}`)} rows={2} hint="One per line as Key: action."
            onChange={(v) => set("a11y", { ...draft.a11y, keyboard: v.map((l) => { const [key, ...rest] = l.split(":"); return { key: key!.trim(), action: rest.join(":").trim() }; }) })} />
          <Lines label="ARIA notes" value={draft.a11y.aria} onChange={(v) => set("a11y", { ...draft.a11y, aria: v })} rows={2} />
        </Stack>
      </Card>

      <Card heading="h2" title="Relationships">
        <div className="row" style={{ alignItems: "flex-start" }}>
          {(["pairsWith", "contains", "within", "excludes"] as const).map((k) => (
            <div key={k} style={{ flex: 1, minWidth: 160 }}>
              <Field label={k} help="Component ids, comma separated">
                <Input value={draft.relationships[k].join(", ")} placeholder="ds.a, ds.b" onChange={(e) => set("relationships", { ...draft.relationships, [k]: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      <Card heading="h2" title="Channels">
        <div className="scroll-x">
          <Table
            caption="Support per channel"
            head={<TableRow><TableCell as="th">Channel</TableCell><TableCell as="th">Support</TableCell><TableCell as="th">Becomes</TableCell><TableCell as="th">Note</TableCell></TableRow>}
            body={Channel.options.map((ch) => {
              const s = draft.channels[ch] ?? { support: "unsupported" as const };
              const setCh = (patch: Partial<typeof s>) => set("channels", { ...draft.channels, [ch]: { ...s, ...patch } });
              return (
                <TableRow key={ch}>
                  <TableCell>{ch}</TableCell>
                  <TableCell>
                    <Select size="sm" value={s.support} aria-label={`${ch} support`} onChange={(e) => setCh({ support: e.target.value as typeof s.support })}>{options(["native", "degraded", "unsupported"])}</Select>
                  </TableCell>
                  <TableCell><Input size="sm" value={s.as ?? ""} aria-label={`${ch} becomes`} onChange={(e) => setCh({ as: e.target.value || undefined })} /></TableCell>
                  <TableCell><Input size="sm" value={s.note ?? ""} aria-label={`${ch} note`} onChange={(e) => setCh({ note: e.target.value || undefined })} /></TableCell>
                </TableRow>
              );
            })}
          />
        </div>
      </Card>
    </Stack>
  );
}
