// MCP server over a built catalog. Read-only, deterministic: no model runs here, every answer
// comes from the contracts. Transport-agnostic; see server.ts for stdio and the portal for HTTP.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Category, CompositionNode, type Catalog, type Contract } from "@elos/contracts";
import { findContract, validateComposition } from "@elos/core";

const text = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const STOP = new Set(["the", "and", "with", "for", "that", "this", "from", "into", "use", "when"]);
const words = (s: string) => (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2 && !STOP.has(w));

/** Deterministic keyword ranking over the contract's enumerable guidance. */
export function findComponents(catalog: Catalog, intent: string, limit = 5) {
  const q = new Set(words(intent));
  const hits = (fields: string[]) => fields.flatMap(words).filter((w) => q.has(w));
  return catalog.contracts
    .filter((c) => c.status !== "deprecated")
    .map((c) => {
      const intents = hits(c.usage.intents);
      const name = hits([c.name, c.id.replace("ds.", "")]);
      const when = hits(c.usage.when);
      const desc = hits([c.description]);
      const caution = c.usage.whenNot.filter((s) => hits([s]).length > 0);
      // A when-not hit still surfaces the component, so the agent learns what not to use it for.
      const score = intents.length * 4 + name.length * 3 + when.length * 2 + desc.length + caution.length;
      const matched = [...new Set([...intents, ...name, ...when, ...desc])];
      return { id: c.id, name: c.name, score, matched, caution, description: c.description };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}

const menuEntry = (c: Contract) => ({
  id: c.id,
  name: c.name,
  category: c.category,
  status: c.status,
  description: c.description,
  intents: c.usage.intents,
  props: c.props.map((p) => `${p.name}${p.required ? "*" : ""}: ${typeof p.type === "object" ? p.type.enum.join("|") : p.type}`),
  slots: slotNames(c),
});

function slotNames(c: Contract): string[] {
  const out: string[] = [];
  const walk = (parts: Contract["anatomy"]) =>
    Object.entries(parts).forEach(([n, p]) => {
      if (p.slot) out.push(n);
      if (p.parts) walk(p.parts);
    });
  walk(c.anatomy);
  return out;
}

export function createServer(catalog: Catalog): McpServer {
  const { system } = catalog;
  const server = new McpServer(
    { name: `elos-${system.id}`, version: system.version },
    {
      instructions: [
        `Design system "${system.name}" v${system.version}, served by Elos.`,
        "Workflow: find_component (by intent) -> get_component (full contract) -> compose a tree -> validate_composition.",
        "Only components in this catalog exist. Never invent components, props or variants; if nothing fits, say so.",
        "Respect usage.whenNot, guidelines.dont and slot restrictions. Use design tokens, never raw values.",
      ].join("\n"),
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "List components",
      description: "The menu: every component with its category, intents, props and slots. Filter by category.",
      inputSchema: { category: Category.optional() },
    },
    async ({ category }) => text(catalog.contracts.filter((c) => !category || c.category === category).map(menuEntry)),
  );

  server.registerTool(
    "get_component",
    {
      title: "Get component contract",
      description: "Full contract for one component: props, anatomy with token bindings, states, a11y, usage, guidelines, relationships, channel support, examples.",
      inputSchema: { id: z.string().describe("Contract id, e.g. ds.button") },
    },
    async ({ id }) => {
      const c = findContract(catalog, id);
      if (!c) return { ...text({ error: `Unknown component ${id}`, available: catalog.contracts.map((c) => c.id) }), isError: true };
      return text(c);
    },
  );

  server.registerTool(
    "find_component",
    {
      title: "Find component by intent",
      description: "Rank components for what you are trying to do (e.g. 'confirm and delete', 'summarize a report'). Deterministic keyword match over intents, usage and names. 'caution' lists when-not rules that also matched.",
      inputSchema: { intent: z.string(), limit: z.number().int().min(1).max(20).optional() },
    },
    async ({ intent, limit }) => text(findComponents(catalog, intent, limit)),
  );

  server.registerTool(
    "list_tokens",
    {
      title: "List design tokens",
      description: "Resolved tokens for a theme ('base' is the default light theme). Filter by path prefix, e.g. 'color.action'.",
      inputSchema: { theme: z.string().optional(), prefix: z.string().optional() },
    },
    async ({ theme = "base", prefix }) => {
      const tokens = catalog.tokens[theme];
      if (!tokens) return { ...text({ error: `Unknown theme ${theme}`, available: Object.keys(catalog.tokens) }), isError: true };
      return text(tokens.filter((t) => !prefix || t.path.startsWith(prefix)).map((t) => ({ path: t.path, cssVar: `--${t.path.replace(/\./g, "-")}`, type: t.type, value: t.value })));
    },
  );

  server.registerTool(
    "validate_composition",
    {
      title: "Validate a composition tree",
      description: "Check a UI tree (component ids, props, slot contents) against the catalog before rendering. Returns every violation.",
      inputSchema: { tree: CompositionNode },
    },
    async ({ tree }) => {
      const errors = validateComposition(catalog, tree);
      return { ...text({ valid: errors.length === 0, errors }), isError: errors.length > 0 };
    },
  );

  return server;
}
