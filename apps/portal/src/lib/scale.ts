// Shared by server pages and client controls: which primitive tokens form the scale a token should snap to.
import type { Catalog, ResolvedToken } from "@elos/contracts";

export type Stop = { path: string; value: string; px: number };

/** Primitive dimension tokens on the same scale as this token (space.*, radius.*, font.size.*), by size. */
export function scaleFor(catalog: Catalog, token: ResolvedToken): Stop[] {
  const target = token.alias ?? token.path;
  const head = target.split(".").slice(0, target.startsWith("font.") ? 2 : 1).join(".");
  if (!token.alias && token.path.split(".").length <= 2) return []; // a primitive is the scale, it has no scale
  return catalog.tokens.base
    .filter((t) => t.type === "dimension" && !t.alias && t.path.startsWith(head + ".") && t.path !== token.path)
    .map((t) => ({ path: t.path, value: t.value, px: parseFloat(t.value) }))
    .filter((s) => !Number.isNaN(s.px))
    .sort((a, b) => a.px - b.px);
}
