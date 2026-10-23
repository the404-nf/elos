// Contracts layer: the stack-agnostic source of truth for a design system.
// Everything an AI or a renderer needs is declared here, nothing is inferred from code.
import { z } from "zod";

// ---------- shared ----------
export const ContractId = z.string().regex(/^ds\.[a-z][a-z0-9-]*$/, "ds.<kebab-name>");
export const Semver = z.string().regex(/^\d+\.\d+\.\d+$/);
// {group.path} with optional {prop} substitutions, e.g. {color.action.{variant}.background}
export const TokenRef = z.string().regex(/^\{[^{}]*(\{[a-zA-Z]+\}[^{}]*)*\}$/);

export const Channel = z.enum(["web", "widget", "slack", "markdown"]);
export type Channel = z.infer<typeof Channel>;

const Scalar = z.union([z.string(), z.number(), z.boolean()]);

// ---------- tokens (DTCG) ----------
const Dimension = z.object({ value: z.number(), unit: z.enum(["px", "rem", "em", "%"]) });
export const Token = z.object({
  $type: z.enum(["color", "dimension", "fontFamily", "fontWeight", "number", "duration", "shadow", "cubicBezier"]).optional(),
  $value: z.union([z.string(), z.number(), Dimension, z.record(z.string(), z.unknown())]),
  $description: z.string().optional(),
});
export type Token = z.infer<typeof Token>;

// A token group is a nested tree. `$type` on a group is inherited by its children (DTCG).
export type TokenGroup = { [key: string]: Token | TokenGroup | string | undefined };
export const TokenGroup: z.ZodType<TokenGroup> = z.lazy(() => z.record(z.string(), z.union([Token, TokenGroup, z.string()])));

// ---------- composition (what an agent emits; what every channel renders) ----------
export type CompositionNode = {
  component: string;
  props?: Record<string, string | number | boolean>;
  slots?: Record<string, (CompositionNode | string)[]>;
};
export const CompositionNode: z.ZodType<CompositionNode> = z.lazy(() =>
  z.object({
    component: ContractId,
    props: z.record(z.string(), Scalar).optional(),
    slots: z.record(z.string(), z.array(z.union([CompositionNode, z.string()]))).optional(),
  }),
);

// ---------- component contract ----------
export const PropType = z.union([z.literal("boolean"), z.literal("text"), z.literal("number"), z.object({ enum: z.array(z.string()).min(1) })]);

export const Prop = z.object({
  name: z.string(),
  description: z.string(),
  type: PropType,
  default: Scalar.optional(),
  required: z.boolean().default(false),
  // Rendered as this HTML attribute on the root element (e.g. "placeholder", "disabled", "aria-invalid").
  attribute: z.string().optional(),
});

export const State = z.enum(["hover", "focus-visible", "active", "disabled", "selected", "checked", "open", "invalid"]);
export type State = z.infer<typeof State>;

const TokenBindings = z.record(z.string(), TokenRef); // css-property -> token ref

// Literal CSS a part may carry. Whitelisted: anything a token can express must be a token binding instead.
export const StyleKey = z.enum([
  "position", "inset", "top", "right", "bottom", "left", "z-index", "width", "min-width", "max-width", "height", "min-height", "max-height",
  "overflow", "overflow-y", "flex", "flex-wrap", "flex-direction", "align-items", "justify-content", "align-self", "text-align", "white-space",
  "cursor", "transform", "transition", "appearance", "box-sizing", "margin", "line-height", "text-transform", "letter-spacing", "resize", "display",
]);
const Styles = z.partialRecord(StyleKey, z.string());
export type Styles = z.infer<typeof Styles>;

export type Part = {
  description?: string;
  element?: string; // HTML element, or "{prop}" to take it from an enum prop (e.g. Text's "as")
  tokens?: Record<string, string>;
  states?: Partial<Record<State, Record<string, string>>>;
  tokensByProp?: Record<string, Record<string, Record<string, string>>>;
  styles?: Styles;
  stylesByProp?: Record<string, Record<string, Styles>>;
  stylesByState?: Partial<Record<State, Styles>>;
  layout?: { display?: "flex" | "grid" | "block" | "inline-flex"; direction?: "row" | "column"; align?: string; justify?: string; gap?: string };
  slot?: { accepts?: string[]; acceptsMode?: "prefer" | "restrict" | "open"; min?: number; max?: number; decorate?: string };
  component?: { id: string; props?: Record<string, string | number | boolean> };
  content?: { prop: string };
  optional?: boolean;
  parts?: Record<string, Part>;
};
export const Part: z.ZodType<Part> = z.lazy(() =>
  z.object({
    description: z.string().optional(),
    element: z.string().optional(),
    tokens: TokenBindings.optional(),
    states: z.partialRecord(State, TokenBindings).optional(),
    tokensByProp: z.record(z.string(), z.record(z.string(), TokenBindings)).optional(),
    styles: Styles.optional(),
    stylesByProp: z.record(z.string(), z.record(z.string(), Styles)).optional(),
    stylesByState: z.partialRecord(State, Styles).optional(),
    layout: z
      .object({
        display: z.enum(["flex", "grid", "block", "inline-flex"]).optional(),
        direction: z.enum(["row", "column"]).optional(),
        align: z.string().optional(),
        justify: z.string().optional(),
        gap: TokenRef.optional(),
      })
      .optional(),
    slot: z
      .object({
        accepts: z.array(ContractId).optional(),
        acceptsMode: z.enum(["prefer", "restrict", "open"]).optional(),
        min: z.number().int().min(0).optional(),
        max: z.number().int().min(1).optional(),
        // Behavior part whose DOM props are merged onto each slotted child's root (e.g. a dialog's "trigger").
        decorate: z.string().optional(),
      })
      .optional(),
    component: z.object({ id: ContractId, props: z.record(z.string(), Scalar).optional() }).optional(),
    content: z.object({ prop: z.string() }).optional(),
    optional: z.boolean().optional(),
    parts: z.record(z.string(), Part).optional(),
  }),
);

export const ChannelSupport = z.object({
  support: z.enum(["native", "degraded", "unsupported"]),
  as: z.string().optional(), // what it becomes on that channel, e.g. "section+actions"
  note: z.string().optional(),
});

export const Category = z.enum(["action", "form", "navigation", "data-display", "layout", "overlay", "feedback", "media", "ai"]);
export type Category = z.infer<typeof Category>;

export const Contract = z.object({
  id: ContractId,
  name: z.string(),
  version: Semver,
  status: z.enum(["draft", "stable", "deprecated"]),
  category: Category,
  description: z.string(),
  semantics: z.object({ element: z.string(), role: z.string().optional() }),
  // Logic layer hook: the headless behavior machine this component binds to. Absent for static components.
  behavior: z.string().optional(),
  props: z.array(Prop),
  states: z.array(State),
  anatomy: z.record(z.string(), Part),
  a11y: z.object({
    focusVisible: z.boolean(),
    minHitArea: z.number().optional(),
    contrast: z.enum(["AA", "AAA"]),
    keyboard: z.array(z.object({ key: z.string(), action: z.string() })).default([]),
    aria: z.array(z.string()).default([]), // e.g. "aria-pressed when used as a toggle"
  }),
  // AI-facing guidance. Short enumerable statements, never prose, so lookup stays deterministic.
  usage: z.object({
    when: z.array(z.string()),
    whenNot: z.array(z.string()),
    intents: z.array(z.string()),
    // "Choose this vs that": the component to use instead, and when.
    alternatives: z.array(z.object({ component: ContractId, when: z.string() })).default([]),
  }),
  guidelines: z.object({ do: z.array(z.string()), dont: z.array(z.string()) }).default({ do: [], dont: [] }),
  resources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
  relationships: z.object({
    pairsWith: z.array(ContractId).default([]),
    excludes: z.array(ContractId).default([]),
    contains: z.array(ContractId).default([]),
    within: z.array(ContractId).default([]),
  }),
  channels: z.partialRecord(Channel, ChannelSupport),
  examples: z.array(z.object({ name: z.string(), tree: CompositionNode })).default([]),
});
export type Contract = z.infer<typeof Contract>;

// ---------- page examples: composed screens built from the system's own components ----------
// They are what tokens are previewed against, and few-shot material for agents.
export const PageExample = z.object({
  id: z.string().regex(/^page\.[a-z][a-z0-9-]*$/),
  name: z.string(),
  description: z.string(),
  tree: CompositionNode,
});
export type PageExample = z.infer<typeof PageExample>;

// ---------- system manifest ----------
export const Theme = z.object({
  name: z.string(),
  kind: z.enum(["mode", "brand"]), // mode = light/dark; brand = multi-brand overlay. Overlays compose in order.
  selector: z.string(), // CSS selector that activates it, e.g. [data-theme="dark"]
  overlay: z.string(), // path to a partial token file, relative to the system root
});
export type Theme = z.infer<typeof Theme>;

export const SystemManifest = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string(),
  version: Semver,
  tokens: z.array(z.string()).min(1), // base token files, merged in order. The base IS the default theme (light).
  themes: z.array(Theme).default([]),
  contracts: z.string().default("contracts"), // folder of *.contract.json
  pages: z.string().default("pages"), // folder of *.page.json
});
export type SystemManifest = z.infer<typeof SystemManifest>;

// ---------- built catalog (what MCP, REST and every renderer consume) ----------
export const ResolvedToken = z.object({
  path: z.string(),
  type: z.string().optional(),
  value: z.string(), // fully resolved
  alias: z.string().optional(), // the token this one points at, when its raw value is an alias
  description: z.string().optional(),
});
export type ResolvedToken = z.infer<typeof ResolvedToken>;

export const Catalog = z.object({
  system: SystemManifest,
  builtAt: z.string(),
  tokens: z.record(z.string(), z.array(ResolvedToken)), // "base" and each theme name -> flat resolved tokens
  contracts: z.array(Contract),
  pages: z.array(PageExample).default([]),
});
export type Catalog = z.infer<typeof Catalog>;

export const jsonSchemas = () => ({
  contract: z.toJSONSchema(Contract),
  catalog: z.toJSONSchema(Catalog),
  composition: z.toJSONSchema(CompositionNode),
});
