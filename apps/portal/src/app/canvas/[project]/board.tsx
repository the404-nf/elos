"use client";
// The Canvas board (ADR 0017, docs/canvas.md): frames are screens on an infinite stage; a click picks a node; the
// inspector edits props, slots and the frame; the library places components into a slot. Every edit is one
// operation applied in one place, with undo; Save validates the project against the bound catalog.
import { useEffect, useMemo, useRef, useState, useTransition, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import { useRouter } from "next/navigation";
import type { CanvasProject, CanvasScreen, Catalog } from "@elos/contracts";
import { validateComposition, type Node, type Scalar } from "@elos/core/composition";
import { Alert, Badge, Button, Checkbox, Field, Icon, Input, Nav, NavItem, Option, Render, Select, Stack, Text } from "@/components/elos-client.tsx";
import { ThemeToggle } from "@/components/elos-client.tsx";
import { applyScreenOp, getNode, nodeLabel, nodeList, parsePath, slotsOf, type Item, type ScreenOp } from "@/lib/compose.ts";
import { saveScreensAction } from "../actions.ts";

const VIEWPORTS = { phone: [390, 844], tablet: [834, 1112], desktop: [1280, 800], custom: [800, 600] } as const;
type Viewport = keyof typeof VIEWPORTS;
type Tool = "select" | "hand";
type Sel = { screen: string; path: string | null } | null;
const mono = { fontFamily: "var(--font-family-mono)" } as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function Board({ project, screens: initial, catalog }: { project: CanvasProject; screens: CanvasScreen[]; catalog: Catalog }) {
  const router = useRouter();
  const [screens, setScreens] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [history, setHistory] = useState<CanvasScreen[][]>([]);
  const [sel, setSel] = useState<Sel>(initial[0] ? { screen: initial[0].id, path: null } : null);
  const [tool, setTool] = useState<Tool>("select");
  const [drawer, setDrawer] = useState<"library" | "frame" | null>(null);
  const [query, setQuery] = useState("");
  const [canvasTheme, setCanvasTheme] = useState<"light" | "dark">("dark");
  const [view, setView] = useState({ k: 0.5, x: 40, y: 60 });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "pan" | "frame"; id?: string; x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const screen = screens.find((s) => s.id === sel?.screen);
  const tree = screen?.tree as Node | undefined;
  const path = sel?.path !== null && sel?.path !== undefined && tree && getNode(tree, sel.path) ? sel.path : null;
  const node = tree && path !== null ? getNode(tree, path)! : undefined;
  const contract = node && catalog.contracts.find((c) => c.id === node.component);
  const problems = useMemo(() => Object.fromEntries(screens.map((s) => [s.id, validateComposition(catalog, s.tree as Node)])), [catalog, screens]);
  const invalid = Object.values(problems).flat();
  const lastValid = useRef<Record<string, Node>>({});
  for (const s of screens) if (!problems[s.id]!.length) lastValid.current[s.id] = s.tree as Node;
  const dirty = JSON.stringify(screens) !== JSON.stringify(baseline);

  const change = (next: CanvasScreen[]) => {
    setHistory((h) => [...h.slice(-49), screens]);
    setScreens(next);
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setScreens(prev);
  };
  const patchScreen = (id: string, fn: (s: CanvasScreen) => CanvasScreen) => change(screens.map((s) => (s.id === id ? fn(s) : s)));
  const op = (o: ScreenOp) => screen && patchScreen(screen.id, (s) => ({ ...s, tree: applyScreenOp(s.tree as Node, o) as CanvasScreen["tree"] }));
  const items = (p: string, slot: string): Item[] => (tree && (getNode(tree, p)?.slots?.[slot] as Item[] | undefined)) ?? [];
  const removeNode = (p: string) => {
    const at = parsePath(p);
    if (!at || !screen) return;
    op({ path: at.parent, slot: at.slot, items: items(at.parent, at.slot).filter((_, i) => i !== at.index) });
    setSel({ screen: screen.id, path: at.parent });
  };
  const moveNode = (p: string, dir: 1 | -1) => {
    const at = parsePath(p);
    if (!at || !screen) return;
    const list = [...items(at.parent, at.slot)];
    const j = at.index + dir;
    if (j < 0 || j >= list.length) return;
    [list[at.index], list[j]] = [list[j]!, list[at.index]!];
    op({ path: at.parent, slot: at.slot, items: list });
    setSel({ screen: screen.id, path: `${at.parent}/${at.slot}/${j}` });
  };
  /** Places a component: into the selected node's first slot that takes it, else beside the selected node in its parent's slot. */
  const place = (componentId: string) => {
    if (!screen || !tree) return;
    const c = catalog.contracts.find((x) => x.id === componentId);
    if (!c) return;
    const fresh = { component: c.id, props: (c.examples[0]?.tree.props ?? {}) as Node["props"] };
    const target = path ?? "";
    const targetNode = getNode(tree, target)!;
    const targetContract = catalog.contracts.find((x) => x.id === targetNode.component)!;
    // A slot that names the component wins (a card's actions for a button), then the main slot, then any open slot with room.
    const open = slotsOf(targetContract).filter((s) => (!s.accepts || s.accepts.includes(c.id)) && (!s.max || items(target, s.name).length < s.max));
    const slot = open.find((s) => s.accepts?.includes(c.id)) ?? open.find((s) => /^(body|root|content|children)$/.test(s.name)) ?? open[0];
    if (slot) {
      const list = items(target, slot.name);
      op({ path: target, slot: slot.name, items: [...list, fresh] });
      setSel({ screen: screen.id, path: `${target}/${slot.name}/${list.length}` });
      return;
    }
    const at = parsePath(target);
    if (!at) return setError(`${c.name} has nowhere to go: ${targetContract.name} has no slot for it.`);
    const list = items(at.parent, at.slot);
    op({ path: at.parent, slot: at.slot, items: [...list.slice(0, at.index + 1), fresh, ...list.slice(at.index + 1)] });
    setSel({ screen: screen.id, path: `${at.parent}/${at.slot}/${at.index + 1}` });
  };
  const addFrame = (name: string, viewport: Viewport) => {
    const id = `screen.${slug(name)}`;
    if (!slug(name) || screens.some((s) => s.id === id)) return setError(`A screen named "${name}" exists already.`);
    const [width, height] = VIEWPORTS[viewport];
    const right = screens.reduce((m, s) => Math.max(m, s.frame.x + s.frame.width), 0);
    const next: CanvasScreen = { id, name, description: "", frame: { x: right ? right + 80 : 0, y: 0, width, height, viewport }, tree: { component: "ds.stack", props: { gap: "lg" }, slots: { root: [] } } };
    change([...screens, next]);
    setSel({ screen: id, path: null });
    setDrawer(null);
    setError(null);
  };
  const removeFrame = (id: string) => {
    change(screens.filter((s) => s.id !== id));
    setSel(null);
  };
  const save = () =>
    start(async () => {
      setError(null);
      const r = await saveScreensAction(project.id, screens);
      if (!r.ok) return setError(r.error);
      setBaseline(screens);
      router.refresh();
    });

  // ---------- the stage: zoom around the pointer, pan by wheel or drag, frames dragged by their label ----------
  const wheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const r = boardRef.current!.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const k = Math.min(4, Math.max(0.1, view.k * Math.exp(-e.deltaY / 400)));
      setView({ k, x: px - ((px - view.x) * k) / view.k, y: py - ((py - view.y) * k) / view.k });
    } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const label = t.closest(".frame-label") as HTMLElement | null;
    if (label) {
      const id = label.parentElement!.dataset.frame!;
      const s = screens.find((x) => x.id === id)!;
      drag.current = { kind: "frame", id, x: e.clientX, y: e.clientY, ox: s.frame.x, oy: s.frame.y, moved: false };
      setSel({ screen: id, path: null });
    } else if (tool === "hand" || !t.closest(".frame")) drag.current = { kind: "pan", x: e.clientX, y: e.clientY, ox: view.x, oy: view.y, moved: false };
    else return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
    if (d.kind === "pan") setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
    else setScreens((ss) => ss.map((s) => (s.id === d.id ? { ...s, frame: { ...s.frame, x: Math.round(d.ox + dx / view.k), y: Math.round(d.oy + dy / view.k) } } : s)));
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.kind === "frame" && d.moved) setHistory((h) => [...h.slice(-49), screens.map((s) => (s.id === d.id ? { ...s, frame: { ...s.frame, x: d.ox, y: d.oy } } : s))]); // the move is one undo step
  };
  const fit = () => {
    const b = boardRef.current;
    if (!b || !screens.length) return;
    const minX = Math.min(...screens.map((s) => s.frame.x));
    const minY = Math.min(...screens.map((s) => s.frame.y));
    const maxX = Math.max(...screens.map((s) => s.frame.x + s.frame.width));
    const maxY = Math.max(...screens.map((s) => s.frame.y + s.frame.height));
    const k = Math.min(1, (b.clientWidth - 80) / (maxX - minX), (b.clientHeight - 100) / (maxY - minY));
    setView({ k, x: (b.clientWidth - (maxX - minX) * k) / 2 - minX * k, y: (b.clientHeight - (maxY - minY) * k) / 2 - minY * k + 10 });
  };
  const pick = (e: MouseEvent<HTMLDivElement>) => {
    if (drag.current?.moved) return;
    const t = e.target as HTMLElement;
    if (t.closest(".frame-label")) return;
    const frame = t.closest(".frame") as HTMLElement | null;
    if (!frame) return setSel((s) => (s ? { screen: s.screen, path: null } : s));
    e.preventDefault();
    e.stopPropagation();
    const el = t.closest("[data-node]");
    setSel({ screen: frame.dataset.frame!, path: el && frame.contains(el) ? el.getAttribute("data-node") : "" });
  };
  useEffect(() => {
    const b = boardRef.current;
    const measure = () => {
      const el = b && sel && path !== null ? b.querySelector(`[data-frame="${CSS.escape(sel.screen)}"] [data-node="${CSS.escape(path)}"]`) : null;
      if (!b || !el) return setBox(null);
      const c = b.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setBox({ left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height });
    };
    measure();
    const ro = b ? new ResizeObserver(measure) : null;
    if (b) ro!.observe(b);
    return () => ro?.disconnect();
  }, [sel, path, screens, view, canvasTheme]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      if ((e.key === "Delete" || e.key === "Backspace") && path) { e.preventDefault(); removeNode(path); }
      if (e.key === "v") setTool("select");
      if (e.key === "h") setTool("hand");
      if (e.key === "c") setDrawer((d) => (d === "library" ? null : "library"));
      if (e.key === "f") setDrawer((d) => (d === "frame" ? null : "frame"));
      if (e.key === "Escape") setDrawer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const listNav = (label: string, rows: { key: string; label: string; on: boolean; go: () => void; indent?: number }[]) => (
    <Nav label={label} list={rows.map((i) => <NavItem key={i.key} href="#" label={i.label} current={i.on} style={{ marginLeft: (i.indent ?? 0) * 14 }} onClick={(e) => { e.preventDefault(); i.go(); }} />)} />
  );
  const library = catalog.contracts.filter((c) => c.category !== "overlay" && (!query || `${c.name} ${c.id} ${c.description} ${c.usage?.intents?.join(" ") ?? ""}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const rail = (key: string, icon: string, label: string, on: boolean, go: () => void) => <Button key={key} label="" aria-label={label} title={label} variant="ghost" shape="circle" icon={<Icon name={icon} size="sm" />} aria-pressed={on} onClick={go} />;

  return (
    <div className="canvas-app">
      <div className="canvas-top">
        <Button label="Projects" variant="ghost" size="sm" icon={<Icon name="chevron-left" size="sm" />} onClick={() => router.push("/")} />
        <Text as="span" variant="label" text={project.name} />
        <Badge label={`${catalog.system.name} · ${project.system.version}`} />
        <Stack direction="row" gap="xs" align="center" style={{ marginLeft: "auto" }}>
          <Text as="span" variant="caption" tone="secondary" text={dirty ? "Unsaved" : "Saved"} />
          <Button label="Undo" variant="ghost" size="sm" disabled={history.length === 0} onClick={undo} />
          <Button label="Discard" variant="ghost" size="sm" disabled={!dirty} onClick={() => { change(baseline); setHistory([]); }} />
          <Button label={pending ? "Saving…" : "Save"} size="sm" disabled={!dirty || pending || invalid.length > 0} onClick={save} />
          <Button label={`${Math.round(view.k * 100)}%`} variant="ghost" size="sm" title="Fit" onClick={fit} />
          <Nav label="Canvas theme" orientation="horizontal" list={(["light", "dark"] as const).map((t) => <NavItem key={t} href="#" label={cap(t)} tone="chip" current={canvasTheme === t} onClick={(e) => { e.preventDefault(); setCanvasTheme(t); }} />)} />
          <ThemeToggle />
        </Stack>
      </div>
      <div className="canvas-body">
        <div className="rail">
          {rail("select", "cursor", "Select (V)", tool === "select", () => setTool("select"))}
          {rail("hand", "hand", "Hand (H)", tool === "hand", () => setTool("hand"))}
          {rail("frame", "frame", "New frame (F)", drawer === "frame", () => setDrawer(drawer === "frame" ? null : "frame"))}
          {rail("library", "components", "Components (C)", drawer === "library", () => setDrawer(drawer === "library" ? null : "library"))}
        </div>
        <div style={{ position: "relative", minWidth: 0 }}>
          {drawer === "library" && (
            <div className="drawer">
              <Input size="sm" placeholder="Find by name or intent" aria-label="Find a component" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Text variant="caption" tone="secondary" text={screen ? `Places into ${node ? nodeLabel(node) : screen.name}.` : "Pick a frame first."} />
              {listNav("Library", library.map((c) => ({ key: c.id, label: `${c.name} · ${c.category}`, on: false, go: () => place(c.id) })))}
            </div>
          )}
          {drawer === "frame" && (
            <form className="drawer" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); addFrame(String(f.get("name")), String(f.get("viewport")) as Viewport); }}>
              <Text as="span" variant="label" text="New frame" />
              <Field label="Name"><Input size="sm" name="name" placeholder="Checkout" aria-label="Frame name" /></Field>
              <Field label="Viewport">
                <Select size="sm" name="viewport" defaultValue="desktop">{(Object.keys(VIEWPORTS) as Viewport[]).map((v) => <Option key={v} value={v} label={`${cap(v)} ${VIEWPORTS[v][0]}×${VIEWPORTS[v][1]}`} />)}</Select>
              </Field>
              <Button label="Add frame" type="submit" size="sm" />
            </form>
          )}
          <div ref={boardRef} className="board" data-tool={tool} data-theme={canvasTheme} onWheel={wheel} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClickCapture={pick} onDoubleClick={fit} style={{ height: "100%" }}>
            <div className="stage" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
              {screens.map((s) => (
                <div key={s.id} className={`frame${sel?.screen === s.id ? " frame--on" : ""}`} data-frame={s.id} style={{ left: s.frame.x, top: s.frame.y, width: s.frame.width, height: s.frame.height }}>
                  <span className="frame-label">{s.name} · {s.frame.width}×{s.frame.height}</span>
                  {lastValid.current[s.id] ? <Render tree={lastValid.current[s.id]!} path="" /> : null}
                </div>
              ))}
            </div>
            {box && node && <div className="sel" style={box}><span className="sel-label">{nodeLabel(node)}</span></div>}
            {screens.length === 0 && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Text tone="secondary" text="An empty board. Press F to add the first frame." /></div>}
          </div>
        </div>
        <aside className="side">
          {error && <Alert tone="danger" title="Not applied" description={error} />}
          {invalid.length > 0 && <Alert tone="warning" title="A screen does not validate" description={invalid.join(" · ")} />}
          {!screen && <Text tone="secondary" text="Pick a frame to inspect it." />}
          {screen && path === null && (
            <Stack gap="md">
              <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                <Text as="span" variant="label" text="Frame" />
                <Button label="×" variant="ghost" size="sm" aria-label="Remove frame" onClick={() => removeFrame(screen.id)} />
              </Stack>
              <Field label="Name"><Input size="sm" value={screen.name} onChange={(e) => patchScreen(screen.id, (s) => ({ ...s, name: e.target.value }))} /></Field>
              <Field label="Viewport">
                <Select size="sm" value={screen.frame.viewport} onChange={(e) => { const v = e.target.value as Viewport; patchScreen(screen.id, (s) => ({ ...s, frame: { ...s.frame, viewport: v, ...(v === "custom" ? {} : { width: VIEWPORTS[v][0], height: VIEWPORTS[v][1] }) } })); }}>
                  {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => <Option key={v} value={v} label={cap(v)} />)}
                </Select>
              </Field>
              <Stack direction="row" gap="sm">
                {(["width", "height"] as const).map((k) => <Field key={k} label={cap(k)}><Input size="sm" type="number" value={String(screen.frame[k])} onChange={(e) => patchScreen(screen.id, (s) => ({ ...s, frame: { ...s.frame, [k]: Math.max(1, Number(e.target.value) || 1), viewport: "custom" } }))} /></Field>)}
              </Stack>
              <Field label="Description"><Input size="sm" value={screen.description} onChange={(e) => patchScreen(screen.id, (s) => ({ ...s, description: e.target.value }))} /></Field>
              <Stack gap="xs">
                <Text as="span" variant="caption" tone="secondary" text="Tree" />
                {listNav("Nodes", nodeList(tree!).map((n) => ({ key: n.path || "/", label: nodeLabel(n.node), on: false, go: () => setSel({ screen: screen.id, path: n.path }), indent: n.depth })))}
              </Stack>
            </Stack>
          )}
          {screen && node && contract && path !== null && (
            <Stack gap="md">
              <Stack gap="xs">
                <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                  <Text as="span" variant="label" text={node.component} style={mono} />
                  <Stack direction="row" gap="xs">
                    <Button label="↑" variant="ghost" size="sm" aria-label="Move up" disabled={!path} onClick={() => moveNode(path, -1)} />
                    <Button label="↓" variant="ghost" size="sm" aria-label="Move down" disabled={!path} onClick={() => moveNode(path, 1)} />
                    <Button label="×" variant="ghost" size="sm" aria-label="Remove node" disabled={!path} onClick={() => removeNode(path)} />
                    <Button label="Frame" variant="ghost" size="sm" onClick={() => setSel({ screen: screen.id, path: null })} />
                  </Stack>
                </Stack>
                <Text variant="caption" tone="secondary" text={contract.description} />
              </Stack>
              {contract.props.length > 0 && (
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
                      <Field key={p.name} label={p.name}>
                        <Input size="sm" type={p.type === "number" ? "number" : "text"} value={v === undefined ? "" : String(v)} onChange={(e) => set(e.target.value === "" ? undefined : p.type === "number" ? Number(e.target.value) : e.target.value)} />
                      </Field>
                    );
                  })}
                </div>
              )}
              {slotsOf(contract).map((s) => {
                const list = items(path, s.name);
                return (
                  <div key={s.name} className="sect">
                    <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                      <Text as="span" variant="label" text={`Slot ${s.name}`} />
                      <Text as="span" variant="caption" tone="tertiary" text={`${list.length}${s.max ? ` / ${s.max}` : ""}${s.accepts ? ` · ${s.accepts.map((a) => a.replace("ds.", "")).join(", ")}` : ""}`} />
                    </Stack>
                    <div className="items">
                      {list.map((item, i) => {
                        const p = `${path}/${s.name}/${i}`;
                        return (
                          <div key={p} className="item">
                            {typeof item === "string" ? (
                              <Input size="sm" value={item} aria-label={`${s.name} text ${i + 1}`} onChange={(e) => op({ path, slot: s.name, items: list.map((x, j) => (j === i ? e.target.value : x)) })} />
                            ) : (
                              <Button label={nodeLabel(item)} variant="ghost" size="sm" onClick={() => setSel({ screen: screen.id, path: p })} style={{ justifyContent: "flex-start", minWidth: 0 }} />
                            )}
                            <Button label="↑" variant="ghost" size="sm" aria-label={`Move ${s.name} item ${i + 1} up`} disabled={i === 0} onClick={() => moveNode(p, -1)} />
                            <Button label="↓" variant="ghost" size="sm" aria-label={`Move ${s.name} item ${i + 1} down`} disabled={i === list.length - 1} onClick={() => moveNode(p, 1)} />
                            <Button label="×" variant="ghost" size="sm" aria-label={`Remove ${s.name} item ${i + 1}`} onClick={() => op({ path, slot: s.name, items: list.filter((_, j) => j !== i) })} />
                          </div>
                        );
                      })}
                    </div>
                    {(!s.max || list.length < s.max) && (
                      <Stack direction="row" gap="xs" align="center">
                        <Button label="Component" variant="ghost" size="sm" icon={<Icon name="plus" size="sm" />} onClick={() => setDrawer("library")} />
                        <Button label="Text" variant="ghost" size="sm" aria-label={`Add text to ${s.name}`} onClick={() => op({ path, slot: s.name, items: [...list, "Text"] })} />
                      </Stack>
                    )}
                  </div>
                );
              })}
            </Stack>
          )}
        </aside>
      </div>
    </div>
  );
}
