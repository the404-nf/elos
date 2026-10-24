"use server";
// The third input of ADR 0016: an agent beside the canvas. It works on a copy of the contract with two tools,
// patch_part (the one operation) and render (the bindings resolved per theme), and returns its operations as
// proposals. The editor applies them through the same update as the handles and the inspector, so undo covers them.
import Anthropic from "@anthropic-ai/sdk";
import { Contract, type Catalog } from "@elos/contracts";
import { getDraft } from "@/lib/store.ts";
import { applyOp, checkOp, findPart, render, stepToken, vocabulary, type Op } from "@/lib/operate.ts";

export type Turn = { role: "user" | "assistant"; text: string };

const SYSTEM = `You edit one component of a design system served by Elos. A component is a JSON contract: an anatomy of parts, each binding CSS properties to design tokens written as {path}. You never write pixels or colors: every value is a token reference from the vocabulary below, semantic tokens (the ones with a description) before primitives.

Work with the tools. For each change call patch_part once with the part, the CSS property (or "gap" for the space between a part's children) and the token; call render to read the result in every theme before you answer. Only parts named in the contract exist; do not invent parts, properties or tokens. Keep the component's intent: a change on one state or size should not break the others. When a request cannot be done with tokens, say so instead of approximating.

Answer in two or three short sentences: what you changed and why, in the user's language. The operations themselves are shown to the user as a list, so do not repeat them.

Token vocabulary ({path} type value — description; two values mean light | dark):
`;

const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "patch_part",
    description: "Binds one CSS property of one part to a token: the one editing operation. Use the property gap for the space between a part's children. An empty token removes the binding.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { part: { type: "string" }, property: { type: "string" }, token: { type: "string", description: "A token reference like {space.inset.md}, or empty to remove the binding" } },
      required: ["part", "property", "token"],
      additionalProperties: false,
    },
  },
  {
    name: "render",
    description: "Renders the component as text: every part with its element, layout and bindings resolved to values in every theme. Pass a part name to see only that part.",
    strict: true,
    input_schema: { type: "object", properties: { part: { type: "string", description: "A part name, or empty for the whole component" } }, required: ["part"], additionalProperties: false },
  },
];

const MAX_STEPS = 12;

/** Without an API key the agent is a mock: a few rules over the last message, run through the same tools as the model would.
 *  It exercises the whole path (proposals, Apply, undo) without spending credits. Rules: bigger/smaller on the selected part's
 *  dimensions, rounder, more/less space, and a color family (danger, success, warning, info, accent, primary) on its color bindings. */
function mockTurn(contract: Contract, catalog: Catalog, text: string, selected: string, exec: (name: string, input: Record<string, string>) => string): string {
  const part = findPart(contract.anatomy, selected);
  const t = text.toLowerCase();
  const dir = /smaller|tighter|less|menor|pequen|reduz|menos|aperta/.test(t) ? -1 : /bigger|larger|wider|taller|more|maior|grande|aumenta|mais|folga/.test(t) ? 1 : 0;
  const ran: string[] = [];
  const step = (props: RegExp) => {
    for (const [prop, ref] of Object.entries(part?.tokens ?? {})) {
      if (!props.test(prop)) continue;
      const next = stepToken(catalog, ref, dir as 1 | -1);
      if (next) ran.push(exec("patch_part", { part: selected, property: prop, token: next }));
    }
    if (props.test("gap") && part?.layout?.gap) {
      const next = stepToken(catalog, part.layout.gap, dir as 1 | -1);
      if (next) ran.push(exec("patch_part", { part: selected, property: "gap", token: next }));
    }
  };
  const family = Object.entries({ danger: /danger|error|erro|vermelho|red/, success: /success|sucesso|verde|green/, warning: /warning|aviso|amarelo|amber/, info: /\binfo|azul|blue/, accent: /accent|pink|rosa|destaque/, primary: /primary|primár/ }).find(([, re]) => re.test(t))?.[0];
  if (family) {
    const prefix = family === "accent" ? "color.accent" : family === "primary" ? "color.action.primary" : `color.status.${family}`;
    const pool = catalog.tokens.base.filter((x) => x.path.startsWith(prefix + "."));
    for (const prop of Object.keys(part?.tokens ?? {}).filter((p) => /color|background|fill|stroke/.test(p))) {
      const want = /background|accent-color|fill/.test(prop) ? /background|default|soft/ : /foreground|text|default/;
      const pick = pool.find((x) => want.test(x.path.split(".").pop()!)) ?? pool[0];
      if (pick) ran.push(exec("patch_part", { part: selected, property: prop, token: `{${pick.path}}` }));
    }
  }
  if (/round|redond|radius|raio/.test(t)) step(/border-radius/);
  else if (/space|espaç|padding|gap|margin/.test(t) && dir) step(/padding|gap|margin/);
  else if (dir) step(/width|height|size|padding|gap/);
  const applied = ran.filter((r) => r.startsWith("Applied")).length;
  if (!applied && !ran.length) return `Mock agent, no API key: I understood nothing to do on "${selected}". Try "bigger", "smaller", "rounder", "more space", or a color family (danger, success, accent) while a part with such bindings is selected.`;
  return `Mock agent, no API key: ${applied} operation${applied === 1 ? "" : "s"} on ${selected}${ran.length > applied ? `, ${ran.length - applied} refused` : ""}. Apply to see it on the canvas; Undo takes it back.`;
}

/** One turn of the agent: the transcript so far plus the current contract in, the reply and the proposed operations out. */
export async function agentTurn(ds: string, contract: unknown, transcript: Turn[], selected: string): Promise<{ ok: true; text: string; ops: Op[] } | { ok: false; error: string }> {
  try {
    const parsed = Contract.parse(contract);
    const { catalog } = await getDraft(ds);
    let working = parsed;
    const ops: Op[] = [];
    /** The tools, shared by the model and the mock: render reads the working copy, patch_part checks and applies one operation. */
    const exec = (name: string, input: Record<string, string>): string => {
      if (name === "render") return render(working, catalog, input.part || undefined);
      const op: Op = { part: input.part ?? "", property: input.property ?? "", token: input.token ?? "" };
      const problem = checkOp(working, catalog, op);
      if (problem) return problem;
      working = applyOp(working, op);
      ops.push(op);
      return `Applied. ${render(working, catalog, op.part)}`;
    };
    if (!process.env.ANTHROPIC_API_KEY) {
      const text = mockTurn(working, catalog, transcript.at(-1)?.text ?? "", selected, exec);
      Contract.parse(working);
      return { ok: true, text, ops };
    }
    const client = new Anthropic();
    const context = `Contract ${working.id} (${working.name}): ${working.description}\nProps: ${working.props.map((p) => `${p.name} ${typeof p.type === "string" ? p.type : `[${p.type.enum.join(", ")}]`}`).join("; ")}\nStates: ${working.states.join(", ")}\nSelected part: ${selected}\n\n${render(working, catalog)}`;
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: context },
      { role: "assistant", content: "I have the contract. What should change?" },
      ...transcript.map((t) => ({ role: t.role, content: t.text }) as Anthropic.Beta.BetaMessageParam),
    ];
    let text = "";
    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        system: [{ type: "text", text: SYSTEM + vocabulary(catalog), cache_control: { type: "ephemeral" } }],
        tools,
        messages,
      });
      if (response.stop_reason === "refusal") return { ok: false, error: `The model declined: ${response.stop_details?.explanation ?? "no explanation"}` };
      text = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n").trim() || text;
      const uses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || uses.length === 0) break;
      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = uses.map((u) => {
        const content = exec(u.name, u.input as Record<string, string>);
        return { type: "tool_result", tool_use_id: u.id, content, is_error: u.name === "patch_part" && !content.startsWith("Applied") };
      });
      messages.push({ role: "user", content: results });
    }
    Contract.parse(working); // the proposals must still form a valid contract
    return { ok: true, text: text || (ops.length ? "Done." : "Nothing to change."), ops };
  } catch (e) {
    return { ok: false, error: e instanceof Anthropic.APIError ? `Claude API ${e.status}: ${e.message}` : (e as Error).message };
  }
}
