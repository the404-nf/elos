// Data-driven React renderer: draws any composition tree from a catalog using contract anatomy.
// No component has hand-written markup; the contract is the component.
import { createContext, createElement as h, useContext, type ReactNode } from "react";
import type { Catalog, Contract, Part } from "@elos/contracts";
import { partClass } from "@elos/core";

export type Scalar = string | number | boolean;
export type SlotItem = Node | string | ReactNode;
export type Node = { component: string; props?: Record<string, Scalar>; slots?: Record<string, SlotItem[]> };

/** Behavior seam (logic layer): a hook that maps a contract's behavior name to per-part DOM props.
 *  Zag.js machines plug in here (e.g. dialog -> { trigger: api.getTriggerProps(), content: ... }). */
export type Behavior = (props: Record<string, Scalar>) => Record<string, Record<string, unknown>>;

type Ctx = { catalog: Catalog; behaviors: Record<string, Behavior> };
const ElosContext = createContext<Ctx | null>(null);

export function ElosProvider({ catalog, behaviors = {}, children }: { catalog: Catalog; behaviors?: Record<string, Behavior>; children?: ReactNode }) {
  return h(ElosContext.Provider, { value: { catalog, behaviors } }, children);
}

function useElos(): Ctx {
  const ctx = useContext(ElosContext);
  if (!ctx) throw new Error("ElosProvider is missing");
  return ctx;
}

export function useContract(id: string): Contract {
  const { catalog } = useElos();
  const c = catalog.contracts.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown component ${id}; not in catalog ${catalog.system.id}@${catalog.system.version}`);
  return c;
}

const isNode = (x: unknown): x is Node => typeof x === "object" && x !== null && "component" in x;

function withDefaults(contract: Contract, given: Record<string, Scalar> = {}): Record<string, Scalar> {
  const props: Record<string, Scalar> = {};
  for (const p of contract.props) {
    const v = given[p.name] ?? p.default;
    if (v === undefined) {
      if (p.required) throw new Error(`${contract.id}: prop "${p.name}" is required`);
      continue;
    }
    if (typeof p.type === "object" && !p.type.enum.includes(String(v)))
      throw new Error(`${contract.id}: prop "${p.name}" must be one of ${p.type.enum.join(", ")}, got "${v}"`);
    props[p.name] = v;
  }
  for (const k of Object.keys(given)) if (!contract.props.some((p) => p.name === k)) throw new Error(`${contract.id}: unknown prop "${k}"`);
  return props;
}

export function Render({ tree }: { tree: Node }) {
  const { behaviors } = useElos();
  const contract = useContract(tree.component);
  const props = withDefaults(contract, tree.props);
  const partProps = contract.behavior ? resolveBehavior(behaviors, contract, props) : {};
  const [rootName, root] = Object.entries(contract.anatomy)[0]!;
  return renderPart(contract, rootName, root, props, tree, partProps, true);
}

function resolveBehavior(behaviors: Record<string, Behavior>, contract: Contract, props: Record<string, Scalar>) {
  const b = behaviors[contract.behavior!];
  if (!b) throw new Error(`${contract.id}: behavior "${contract.behavior}" has no adapter registered`);
  return b(props);
}

function renderPart(
  contract: Contract,
  name: string,
  part: Part,
  props: Record<string, Scalar>,
  tree: Node,
  partProps: Record<string, Record<string, unknown>>,
  isRoot: boolean,
): ReactNode {
  const children: ReactNode[] = [];

  if (part.content) {
    const v = props[part.content.prop];
    if (v === undefined || v === "") {
      if (part.optional) return null;
    } else children.push(String(v));
  }
  if (part.slot) {
    const items = tree.slots?.[name] ?? [];
    if (items.length === 0 && part.optional) return null;
    const { accepts, acceptsMode, max } = part.slot;
    if (max !== undefined && items.length > max) throw new Error(`${contract.id}: slot "${name}" accepts at most ${max} items`);
    items.forEach((item, i) => {
      if (isNode(item)) {
        if (acceptsMode === "restrict" && accepts && !accepts.includes(item.component))
          throw new Error(`${contract.id}: slot "${name}" accepts only ${accepts.join(", ")}, got ${item.component}`);
        children.push(h(Render, { key: i, tree: item }));
      } else children.push(item as ReactNode);
    });
  }
  if (part.component) children.push(h(Render, { key: "ref", tree: { component: part.component.id, props: part.component.props } }));
  for (const [childName, child] of Object.entries(part.parts ?? {}))
    children.push(h(Fragment, { key: childName }, renderPart(contract, childName, child, props, tree, partProps, false)));

  const attrs: Record<string, unknown> = { className: partClass(contract.id, name), ...partProps[name] };
  if (isRoot) {
    for (const p of contract.props) {
      const v = props[p.name];
      if (typeof p.type === "object") attrs[`data-${p.name}`] = v;
      else if (p.type === "boolean" && v === true) attrs[`data-${p.name}`] = "";
    }
    if (contract.semantics.role && contract.semantics.role !== part.element) attrs.role = contract.semantics.role;
    if (props.disabled === true && part.element === "button") attrs.disabled = true;
  }
  return h(part.element ?? "div", attrs, ...children);
}

const Fragment = ({ children }: { children?: ReactNode }) => children;

/** Typed convenience wrapper over Render. Scalar props become contract props; React children go to the
 *  first slot; other non-scalar props go to the slot of the same name. */
export function createComponent<P extends Record<string, unknown>>(id: string) {
  return function Component(p: P & { children?: ReactNode }) {
    const contract = useContract(id);
    const firstSlot = findFirstSlot(contract.anatomy);
    const props: Record<string, Scalar> = {};
    const slots: Record<string, SlotItem[]> = {};
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined) continue;
      if (k === "children") slots[firstSlot ?? "children"] = toArray(v);
      else if (["string", "number", "boolean"].includes(typeof v)) props[k] = v as Scalar;
      else slots[k] = toArray(v);
    }
    return h(Render, { tree: { component: id, props, slots } });
  };
}

const toArray = (v: unknown): SlotItem[] => (Array.isArray(v) ? v : [v]) as SlotItem[];

function findFirstSlot(parts: Record<string, Part>): string | undefined {
  for (const [name, part] of Object.entries(parts)) {
    if (part.slot) return name;
    const nested = part.parts && findFirstSlot(part.parts);
    if (nested) return nested;
  }
  return undefined;
}
