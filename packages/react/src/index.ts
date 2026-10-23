// Data-driven React renderer: draws any composition tree from a catalog using contract anatomy.
// No component has hand-written markup; the contract is the component. Behavior (the logic layer)
// plugs in as hooks that return DOM props per anatomy part.
import { createContext, createElement as h, useContext, type ReactNode } from "react";
import type { Catalog, Contract, Part } from "@elos/contracts";
import { partClass } from "@elos/core/css";
import { checkSlots, isNode, resolveProps, type Node, type Scalar } from "@elos/core/composition";

export type { Node, Scalar };
export type SlotItem = Node | string | ReactNode;
export type DomProps = Record<string, unknown>;

/** A behavior is a React hook, one machine per component instance. `parent` is whatever the nearest
 *  behavior ancestor exposed (e.g. the tabs api that a tab trigger needs). */
export type Behavior = (ctx: { props: Record<string, Scalar>; parent: unknown }) => { parts: Record<string, DomProps>; expose?: unknown };

type Ctx = { catalog: Catalog; behaviors: Record<string, Behavior> };
const ElosContext = createContext<Ctx | null>(null);
const ParentBehavior = createContext<unknown>(undefined);
const Decoration = createContext<DomProps | undefined>(undefined); // DOM props a parent adds to this component's root

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

export function Render({ tree }: { tree: Node }) {
  const contract = useContract(tree.component);
  const { props, errors } = resolveProps(contract, tree.props);
  errors.push(...checkSlots(contract, tree));
  if (errors.length) throw new Error(errors.join("\n"));
  return contract.behavior ? h(WithBehavior, { tree, contract, props }) : h(Body, { tree, contract, props, parts: {} });
}

type BodyProps = { tree: Node; contract: Contract; props: Record<string, Scalar>; parts: Record<string, DomProps> };

function WithBehavior({ tree, contract, props }: Omit<BodyProps, "parts">) {
  const { behaviors } = useElos();
  const parent = useContext(ParentBehavior);
  const behavior = behaviors[contract.behavior!];
  if (!behavior) throw new Error(`${contract.id}: behavior "${contract.behavior}" has no adapter registered`);
  const { parts, expose } = behavior({ props, parent });
  return h(ParentBehavior.Provider, { value: expose }, h(Body, { tree, contract, props, parts }));
}

function Body({ tree, contract, props, parts }: BodyProps) {
  const decoration = useContext(Decoration);
  const [rootName, root] = Object.entries(contract.anatomy)[0]!;
  // Reset decoration for everything below: it was meant for this component's root only.
  return h(Decoration.Provider, { value: undefined }, renderPart({ contract, props, tree, parts, decoration }, rootName, root, true));
}

type PartCtx = BodyProps & { decoration?: DomProps };

function renderPart(ctx: PartCtx, name: string, part: Part, isRoot: boolean): ReactNode {
  const { contract, props, tree, parts } = ctx;

  // A part that references another component renders that component in its place, decorated with this part's behavior props.
  if (part.component)
    return h(Decoration.Provider, { key: name, value: parts[name] }, h(Render, { tree: { component: part.component.id, props: part.component.props } }));

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
    const decorate = part.slot.decorate ? parts[part.slot.decorate] : undefined;
    items.forEach((item, i) => {
      const el = isNode(item) ? h(Render, { key: i, tree: item }) : (item as ReactNode);
      children.push(decorate ? h(Decoration.Provider, { key: i, value: decorate }, el) : el);
    });
  }
  for (const [childName, child] of Object.entries(part.parts ?? {}))
    children.push(h(Fragment, { key: childName }, renderPart(ctx, childName, child, false)));

  const attrs: DomProps = { className: partClass(contract.id, name) };
  if (isRoot) {
    for (const p of contract.props) {
      const v = props[p.name];
      if (v === undefined) continue;
      if (typeof p.type === "object") attrs[`data-${p.name}`] = v;
      else if (p.type === "boolean" && v === true) attrs[`data-${p.name}`] = "";
      if (p.attribute) {
        if (p.type !== "boolean") attrs[p.attribute] = v;
        else if (v === true) attrs[p.attribute] = p.attribute.startsWith("aria-") ? "true" : true;
      }
    }
    if (contract.semantics.role && contract.semantics.role !== part.element) attrs.role = contract.semantics.role;
  }
  // A part that decorates its slot hands the behavior props to the slotted child, never to itself.
  Object.assign(attrs, part.slot?.decorate ? undefined : parts[name], isRoot ? ctx.decoration : undefined);

  const bound = part.element?.match(/^\{(\w+)\}$/);
  const element = bound ? String(props[bound[1]!]) : (part.element ?? "div");
  return h(element, { key: name, ...attrs }, ...children);
}

const Fragment = ({ children }: { children?: ReactNode }) => children;

/** Typed convenience wrapper over Render. Scalar props become contract props; React children go to the
 *  first slot; other non-scalar props go to the slot of the same name. */
export function createComponent<P extends Record<string, unknown>>(id: string) {
  return function Component(p: P & { children?: ReactNode }) {
    const contract = useContract(id);
    const firstSlot = findFirstSlot(contract.anatomy);
    const props: Record<string, Scalar> = {};
    const slots: Record<string, unknown[]> = {};
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
