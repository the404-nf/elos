"use client";
// The composition canvas (ADR 0017): a screen rendered as is, a click picks a node, the inspector edits its props and slots.
// Every edit is one operation (node path, prop or slot, value) applied in one place, with undo; Save validates the whole system.
import { useEffect, useMemo, useRef, useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Catalog, Screen } from "@elos/contracts";
import { validateComposition, type Node, type Scalar } from "@elos/core/composition";
import { Alert, Badge, Button, Card, Checkbox, Field, Input, Nav, NavItem, Option, Render, Select, Stack, Text } from "@/components/elos-client.tsx";
import { CopyButton } from "@/components/copy-button.tsx";
import { PageHead } from "@/components/page-head.tsx";
import { applyScreenOp, getNode, nodeLabel, nodeList, parsePath, slotsOf, type Item, type ScreenOp } from "@/lib/compose.ts";
import { saveScreen } from "../actions.ts";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const mono = { fontFamily: "var(--font-family-mono)" } as const;

export function ScreenEditor({ ds, screen, catalog }: { ds: string; screen: Screen; catalog: Catalog }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Screen>(screen);
  const [baseline, setBaseline] = useState<Screen>(screen);
  const [history, setHistory] = useState<Screen[]>([]);
  const [selected, setSelected] = useState("");
  const [canvasTheme, setCanvasTheme] = useState<"light" | "dark">("dark");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cvRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const tree = draft.tree as Node;
  const problems = useMemo(() => validateComposition(catalog, tree), [catalog, tree]);
  const lastValid = useRef(tree);
  if (!problems.length) lastValid.current = tree; // an invalid intermediate tree keeps the last good render on the canvas
  const node = getNode(tree, selected) ?? tree;
  const path = getNode(tree, selected) ? selected : "";
  const contract = catalog.contracts.find((c) => c.id === node.component);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const nodes = nodeList(tree);

  const change = (next: Screen) => {
    setHistory((h) => [...h.slice(-49), draft]);
    setDraft(next);
  };
  const op = (o: ScreenOp) => change({ ...draft, tree: applyScreenOp(tree, o) as Screen["tree"] });
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setDraft(prev);
  };
  const items = (p: string, slot: string): Item[] => (getNode(tree, p)?.slots?.[slot] as Item[] | undefined) ?? [];
  const remove = (p: string) => {
    const at = parsePath(p);
    if (!at) return;
    op({ path: at.parent, slot: at.slot, items: items(at.parent, at.slot).filter((_, i) => i !== at.index) });
    setSelected(at.parent);
  };
  const move = (p: string, dir: 1 | -1) => {
    const at = parsePath(p);
    if (!at) return;
    const list = [...items(at.parent, at.slot)];
    const j = at.index + dir;
    if (j < 0 || j >= list.length) return;
    [list[at.index], list[j]] = [list[j]!, list[at.index]!];
    op({ path: at.parent, slot: at.slot, items: list });
    setSelected(`${at.parent}/${at.slot}/${j}`);
  };
  const add = (p: string, slot: string, componentId: string) => {
    const c = catalog.contracts.find((x) => x.id === componentId);
    if (!c) return;
    const list = items(p, slot);
    op({ path: p, slot, items: [...list, { component: c.id, props: (c.examples[0]?.tree.props ?? {}) as Node["props"] }] });
    setSelected(`${p}/${slot}/${list.length}`);
  };
  const save = () =>
    start(async () => {
      setError(null);
      const r = await saveScreen(ds, draft);
      if (!r.ok) return setError(r.error);
      setBaseline(draft);
      router.refresh();
    });

  // The canvas picks the nearest node of what was clicked; the selection is drawn as an overlay measured from the DOM.
  const pick = (e: MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest("[data-node]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(el.getAttribute("data-node") ?? "");
  };
  useEffect(() => {
    const cv = cvRef.current;
    const measure = () => {
      const el = cv?.querySelector(`[data-node="${CSS.escape(path)}"]`);
      if (!cv || !el) return setBox(null);
      const c = cv.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setBox({ left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height });
    };
    measure();
    const ro = cv ? new ResizeObserver(measure) : null;
    if (cv) ro!.observe(cv);
    return () => ro?.disconnect();
  }, [path, draft, canvasTheme]);

  const listNav = (label: string, rows: { key: string; label: string; on: boolean; go: () => void; indent?: number }[]) => (
    <Nav label={label} list={rows.map((i) => <NavItem key={i.key} href="#" label={i.label} current={i.on} style={{ marginLeft: (i.indent ?? 0) * 14 }} onClick={(e) => { e.preventDefault(); i.go(); }} />)} />
  );
  const chipNav = (label: string, rows: { key: string; label: string; on: boolean; go: () => void }[]) => (
    <Nav label={label} orientation="horizontal" list={rows.map((i) => <NavItem key={i.key} href="#" label={i.label} tone="chip" current={i.on} onClick={(e) => { e.preventDefault(); i.go(); }} />)} />
  );
  const addable = (accepts?: string[]) => (accepts ? catalog.contracts.filter((c) => accepts.includes(c.id)) : catalog.contracts.filter((c) => c.category !== "overlay")).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHead
        title={draft.name}
        description={draft.description || "Click a node on the canvas to pick it; the inspector edits its props and slots. Every edit is one operation; Save validates the tree against the catalog."}
        crumbs={[{ href: `/${ds}/screens`, label: "Screens" }, { href: `/${ds}/screens/${draft.id}`, label: draft.name }]}
        actions={<CopyButton label="Copy tree" text={JSON.stringify(draft.tree, null, 2)} variant="glass" size="md" icon />}
        extras={<><Badge label={`${nodes.length} node${nodes.length === 1 ? "" : "s"}`} /><Text as="code" variant="code" tone="secondary" text={draft.id} /></>}
      />
      <div className="ed">
        <div className="pane"><Card padding="lg">
          <Stack gap="xs">
            <Text as="span" variant="caption" tone="secondary" text="Tree" />
            {listNav("Nodes", nodes.map((n) => ({ key: n.path || "/", label: nodeLabel(n.node), on: n.path === path, go: () => setSelected(n.path), indent: n.depth })))}
          </Stack>
        </Card></div>

        <Stack gap="sm">
          <div className="cv-top" style={{ justifyContent: "space-between" }}>
            {chipNav("Canvas theme", (["light", "dark"] as const).map((t) => ({ key: t, label: cap(t), on: canvasTheme === t, go: () => setCanvasTheme(t) })))}
            <div className="savebar">
              <Text as="span" variant="caption" text={dirty ? "Unsaved operations" : "In the draft"} style={{ color: "inherit" }} />
              <Button label="Undo" variant="ghost" size="sm" disabled={history.length === 0} onClick={undo} />
              <Button label="Discard" variant="ghost" size="sm" disabled={!dirty} onClick={() => { change(baseline); setHistory([]); }} />
              <Button label={pending ? "Saving…" : "Save to draft"} size="sm" disabled={!dirty || pending || problems.length > 0} onClick={save} />
            </div>
          </div>
          {problems.length > 0 && <Alert tone="warning" title="The tree does not validate yet" description={problems.join(" · ")} />}
          {error && <Alert tone="danger" title="Not saved" description={error} />}
          <div ref={cvRef} className="scv" data-theme={canvasTheme} onClickCapture={pick}>
            <Render tree={lastValid.current} path="" />
            {box && <div className="sel" style={box}><span className="sel-label">{nodeLabel(node)}</span></div>}
          </div>
        </Stack>

        <div className="pane"><Card padding="lg">
          <Stack gap="md">
            <Stack gap="xs">
              <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                <Text as="span" variant="label" text={node.component} style={mono} />
                {path && (
                  <Stack direction="row" gap="xs">
                    <Button label="↑" variant="ghost" size="sm" aria-label="Move up" onClick={() => move(path, -1)} />
                    <Button label="↓" variant="ghost" size="sm" aria-label="Move down" onClick={() => move(path, 1)} />
                    <Button label="×" variant="ghost" size="sm" aria-label="Remove node" onClick={() => remove(path)} />
                  </Stack>
                )}
              </Stack>
              {contract && <Text variant="caption" tone="secondary" text={contract.description} />}
            </Stack>
            {contract && contract.props.length > 0 && (
              <div className="sect">
                <Text as="span" variant="label" text="Props" />
                {contract.props.map((p) => {
                  const v = node.props?.[p.name];
                  const set = (value: Scalar | undefined) => op({ path, prop: p.name, value });
                  if (typeof p.type === "object")
                    return (
                      <Field key={p.name} label={p.name}>
                        <Select size="sm" value={v === undefined ? "" : String(v)} onChange={(e) => set(e.target.value || undefined)}>
                          {!p.required && <Option value="" label={p.default !== undefined ? `default (${String(p.default)})` : "unset"} />}
                          {p.type.enum.map((o) => <Option key={o} value={o} label={o} />)}
                        </Select>
                      </Field>
                    );
                  if (p.type === "boolean") return <Checkbox key={p.name} label={p.name} checked={v === true} onChange={(e) => set(e.target.checked || undefined)} />;
                  return (
                    <Field key={p.name} label={p.name} help={p.required ? undefined : p.description}>
                      <Input size="sm" type={p.type === "number" ? "number" : "text"} value={v === undefined ? "" : String(v)} onChange={(e) => set(e.target.value === "" ? undefined : p.type === "number" ? Number(e.target.value) : e.target.value)} />
                    </Field>
                  );
                })}
              </div>
            )}
            {contract && slotsOf(contract).map((s) => {
              const list = items(path, s.name);
              const choices = addable(s.accepts);
              return (
                <div key={s.name} className="sect">
                  <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                    <Text as="span" variant="label" text={`Slot ${s.name}`} />
                    <Text as="span" variant="caption" tone="tertiary" text={`${list.length}${s.max ? ` / ${s.max}` : ""}`} />
                  </Stack>
                  <div className="items">
                    {list.map((item, i) => {
                      const p = `${path}/${s.name}/${i}`;
                      return (
                        <div key={p} className="item">
                          {typeof item === "string" ? (
                            <Input size="sm" value={item} aria-label={`${s.name} text ${i + 1}`} onChange={(e) => op({ path, slot: s.name, items: list.map((x, j) => (j === i ? e.target.value : x)) })} />
                          ) : (
                            <Button label={nodeLabel(item)} variant="ghost" size="sm" onClick={() => setSelected(p)} style={{ justifyContent: "flex-start", minWidth: 0 }} />
                          )}
                          <Button label="↑" variant="ghost" size="sm" aria-label={`Move ${s.name} item ${i + 1} up`} disabled={i === 0} onClick={() => move(p, -1)} />
                          <Button label="↓" variant="ghost" size="sm" aria-label={`Move ${s.name} item ${i + 1} down`} disabled={i === list.length - 1} onClick={() => move(p, 1)} />
                          <Button label="×" variant="ghost" size="sm" aria-label={`Remove ${s.name} item ${i + 1}`} onClick={() => op({ path, slot: s.name, items: list.filter((_, j) => j !== i) })} />
                        </div>
                      );
                    })}
                  </div>
                  {(!s.max || list.length < s.max) && (
                    <Stack direction="row" gap="xs" align="center">
                      <Select size="sm" defaultValue="" aria-label={`Add to ${s.name}`} onChange={(e) => { if (e.target.value) { add(path, s.name, e.target.value); e.target.value = ""; } }}>
                        <Option value="" label="Add a component…" />
                        {choices.map((c) => <Option key={c.id} value={c.id} label={c.name} />)}
                      </Select>
                      <Button label="Text" variant="ghost" size="sm" aria-label={`Add text to ${s.name}`} onClick={() => op({ path, slot: s.name, items: [...list, "Text"] })} />
                    </Stack>
                  )}
                </div>
              );
            })}
          </Stack>
        </Card></div>
      </div>
    </>
  );
}
