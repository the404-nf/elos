// The one operation of ADR 0016, for screens (ADR 0017): a node path, a prop or a slot, a value. Pure functions over a composition tree.
// A path is "" for the root and "/<slot>/<index>" per level below it, the same string the renderer writes to data-node.
import type { Contract } from "@elos/contracts";
import type { Node, Scalar } from "@elos/core/composition";

export type Item = Node | string;
export type ScreenOp = { path: string; prop: string; value?: Scalar } | { path: string; slot: string; items: Item[] };

const segments = (path: string): [string, number][] => {
  const parts = path.split("/").slice(1);
  const out: [string, number][] = [];
  for (let i = 0; i < parts.length; i += 2) out.push([parts[i]!, Number(parts[i + 1])]);
  return out;
};
export const parsePath = (path: string): { parent: string; slot: string; index: number } | null => {
  const segs = segments(path);
  const last = segs.at(-1);
  return last ? { parent: path.slice(0, path.lastIndexOf("/", path.lastIndexOf("/") - 1)), slot: last[0], index: last[1] } : null;
};

export function getNode(tree: Node, path: string): Node | undefined {
  let node: Node | undefined = tree;
  for (const [slot, i] of segments(path)) {
    const item: unknown = node?.slots?.[slot]?.[i];
    node = typeof item === "object" && item !== null && "component" in item ? (item as Node) : undefined;
    if (!node) return undefined;
  }
  return node;
}

export function setNode(tree: Node, path: string, fn: (n: Node) => Node): Node {
  const segs = segments(path);
  const go = (node: Node, depth: number): Node => {
    if (depth === segs.length) return fn(node);
    const [slot, i] = segs[depth]!;
    const items = [...((node.slots?.[slot] as Item[] | undefined) ?? [])];
    const child = items[i];
    if (typeof child !== "object") return node;
    items[i] = go(child, depth + 1);
    return { ...node, slots: { ...node.slots, [slot]: items } };
  };
  return go(tree, 0);
}

/** Applies one operation: a prop (undefined removes it) or a slot's whole item list. */
export function applyScreenOp(tree: Node, op: ScreenOp): Node {
  return setNode(tree, op.path, (n) => {
    if ("prop" in op) {
      const props = { ...n.props };
      if (op.value === undefined) delete props[op.prop];
      else props[op.prop] = op.value;
      return { ...n, props };
    }
    return { ...n, slots: { ...n.slots, [op.slot]: op.items } };
  });
}

/** Every node of the tree in document order, with its path and depth, for a tree pane. Strings in slots are skipped. */
export function nodeList(tree: Node, path = "", depth = 0): { path: string; node: Node; depth: number }[] {
  const out = [{ path, node: tree, depth }];
  for (const [slot, items] of Object.entries(tree.slots ?? {}))
    (items as Item[]).forEach((item, i) => {
      if (typeof item === "object") out.push(...nodeList(item, `${path}/${slot}/${i}`, depth + 1));
    });
  return out;
}

/** The slots a contract offers, in anatomy order, with what they accept. */
export function slotsOf(contract: Contract): { name: string; accepts?: string[]; max?: number }[] {
  const out: { name: string; accepts?: string[]; max?: number }[] = [];
  const walk = (anatomy: Contract["anatomy"]) => {
    for (const [name, p] of Object.entries(anatomy)) {
      if (p.slot) out.push({ name, accepts: p.slot.acceptsMode === "restrict" ? p.slot.accepts : undefined, max: p.slot.max });
      if (p.parts) walk(p.parts);
    }
  };
  walk(contract.anatomy);
  return out;
}

/** A short label for a node: its component and the first text-like prop. */
export const nodeLabel = (node: Node) => {
  const hint = ["text", "label", "title", "name"].map((k) => node.props?.[k]).find((v) => typeof v === "string") as string | undefined;
  return `${node.component.replace(/^ds\./, "")}${hint ? ` · ${hint.length > 24 ? hint.slice(0, 23) + "…" : hint}` : ""}`;
};
