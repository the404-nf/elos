// Composition checks shared by every renderer and by the MCP server. Pure functions, errors as strings.
import type { Catalog, Contract } from "@elos/contracts";

export type Scalar = string | number | boolean;
/** A composition node whose slot items may also be renderer-specific opaque values (e.g. React elements). */
export type Node = { component: string; props?: Record<string, Scalar>; slots?: Record<string, unknown[]> };

export const isNode = (x: unknown): x is Node => typeof x === "object" && x !== null && "component" in x;

export function findContract(catalog: Catalog, id: string): Contract | undefined {
  return catalog.contracts.find((c) => c.id === id);
}

/** Fills defaults and checks required, enum and unknown props. */
export function resolveProps(contract: Contract, given: Record<string, Scalar> = {}): { props: Record<string, Scalar>; errors: string[] } {
  const props: Record<string, Scalar> = {};
  const errors: string[] = [];
  for (const p of contract.props) {
    const v = given[p.name] ?? p.default;
    if (v === undefined) {
      if (p.required) errors.push(`${contract.id}: prop "${p.name}" is required`);
      continue;
    }
    if (typeof p.type === "object" && !p.type.enum.includes(String(v)))
      errors.push(`${contract.id}: prop "${p.name}" must be one of ${p.type.enum.join(", ")}, got "${v}"`);
    else if (p.type === "boolean" && typeof v !== "boolean") errors.push(`${contract.id}: prop "${p.name}" must be a boolean`);
    else props[p.name] = v;
  }
  for (const k of Object.keys(given)) if (!contract.props.some((p) => p.name === k)) errors.push(`${contract.id}: unknown prop "${k}"`);
  return { props, errors };
}

/** Checks slot names, counts and allowed children for one node (not recursive). */
export function checkSlots(contract: Contract, node: Node): string[] {
  const errors: string[] = [];
  const slotParts = new Map<string, NonNullable<Contract["anatomy"][string]["slot"]>>();
  const walk = (parts: Contract["anatomy"]) => {
    for (const [name, part] of Object.entries(parts)) {
      if (part.slot) slotParts.set(name, part.slot);
      if (part.parts) walk(part.parts);
    }
  };
  walk(contract.anatomy);
  for (const [name, items] of Object.entries(node.slots ?? {})) {
    const slot = slotParts.get(name);
    if (!slot) {
      errors.push(`${contract.id}: has no slot "${name}" (slots: ${[...slotParts.keys()].join(", ") || "none"})`);
      continue;
    }
    if (slot.max !== undefined && items.length > slot.max) errors.push(`${contract.id}: slot "${name}" accepts at most ${slot.max} items`);
    if (slot.min !== undefined && items.length < slot.min) errors.push(`${contract.id}: slot "${name}" needs at least ${slot.min} items`);
    if (slot.acceptsMode === "restrict" && slot.accepts)
      for (const item of items)
        if (isNode(item) && !slot.accepts.includes(item.component))
          errors.push(`${contract.id}: slot "${name}" accepts only ${slot.accepts.join(", ")}, got ${item.component}`);
  }
  return errors;
}

/** Full recursive validation of a composition tree against the catalog. Empty array means valid. */
export function validateComposition(catalog: Catalog, tree: Node): string[] {
  const contract = findContract(catalog, tree.component);
  if (!contract) return [`Unknown component ${tree.component}; not in catalog ${catalog.system.id}@${catalog.system.version}`];
  const errors = [...resolveProps(contract, tree.props).errors, ...checkSlots(contract, tree)];
  for (const items of Object.values(tree.slots ?? {}))
    for (const item of items) if (isNode(item)) errors.push(...validateComposition(catalog, item));
  return errors;
}
