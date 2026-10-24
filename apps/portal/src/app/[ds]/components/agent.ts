"use server";
// The third input of ADR 0016: an agent beside the canvas. It works on a copy of the contract with two tools,
// patch_part (the one operation) and render (the bindings resolved per theme), and returns its operations as
// proposals. The editor applies them through the same update as the handles and the inspector, so undo covers them.
import Anthropic from "@anthropic-ai/sdk";
import { Contract } from "@elos/contracts";
import { getDraft } from "@/lib/store.ts";
import { applyOp, checkOp, render, vocabulary, type Op } from "@/lib/operate.ts";

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

/** One turn of the agent: the transcript so far plus the current contract in, the reply and the proposed operations out. */
export async function agentTurn(ds: string, contract: unknown, transcript: Turn[], selected: string): Promise<{ ok: true; text: string; ops: Op[] } | { ok: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "Set ANTHROPIC_API_KEY in apps/portal/.env.local and restart the portal." };
  try {
    const parsed = Contract.parse(contract);
    const { catalog } = await getDraft(ds);
    let working = parsed;
    const ops: Op[] = [];
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
        const input = u.input as Record<string, string>;
        if (u.name === "render") return { type: "tool_result", tool_use_id: u.id, content: render(working, catalog, input.part || undefined) };
        const op: Op = { part: input.part ?? "", property: input.property ?? "", token: input.token ?? "" };
        const problem = checkOp(working, catalog, op);
        if (problem) return { type: "tool_result", tool_use_id: u.id, content: problem, is_error: true };
        working = applyOp(working, op);
        ops.push(op);
        return { type: "tool_result", tool_use_id: u.id, content: `Applied. ${render(working, catalog, op.part)}` };
      });
      messages.push({ role: "user", content: results });
    }
    Contract.parse(working); // the proposals must still form a valid contract
    return { ok: true, text: text || (ops.length ? "Done." : "Nothing to change."), ops };
  } catch (e) {
    return { ok: false, error: e instanceof Anthropic.APIError ? `Claude API ${e.status}: ${e.message}` : (e as Error).message };
  }
}
