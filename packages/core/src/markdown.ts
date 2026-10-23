// Markdown emitter: a contract as documentation. The Markdown channel for Claude Code, Codex and
// design-tool exports; everything comes from the contract, nothing is written by hand.
import type { Contract, Part } from "@elos/contracts";

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const propType = (p: Contract["props"][number]) => (typeof p.type === "object" ? p.type.enum.map((v) => `\`${v}\``).join(", ") : p.type);

function* parts(anatomy: Record<string, Part>, depth = 0): Generator<string> {
  for (const [name, part] of Object.entries(anatomy)) {
    const kind = part.slot
      ? `slot${part.slot.accepts ? ` of ${part.slot.accepts.join(", ")}` : ""}${part.slot.max ? `, max ${part.slot.max}` : ""}`
      : part.component
        ? `${part.component.id}`
        : part.content
          ? `text from \`${part.content.prop}\``
          : (part.element ?? "div");
    yield `${"  ".repeat(depth)}- **${name}** (${kind}${part.optional ? ", optional" : ""})${part.description ? `: ${part.description}` : ""}`;
    if (part.parts) yield* parts(part.parts, depth + 1);
  }
}

export function contractToMarkdown(c: Contract): string {
  const sections: string[] = [
    `# ${c.name}`,
    c.description,
    `\`${c.id}\` · ${c.category} · v${c.version} · ${c.status}${c.behavior ? ` · behavior \`${c.behavior}\`` : ""}`,
  ];

  sections.push("## When to use", list(c.usage.when), "## When not to use", list(c.usage.whenNot));
  if (c.usage.alternatives.length) sections.push("## Use instead", list(c.usage.alternatives.map((a) => `\`${a.component}\` when ${a.when}`)));
  sections.push(`Intents: ${c.usage.intents.join(", ")}`);

  if (c.props.length)
    sections.push(
      "## Props",
      "| Prop | Type | Default | Description |\n|---|---|---|---|",
      c.props.map((p) => `| \`${p.name}\`${p.required ? " *" : ""} | ${propType(p)} | ${p.default === undefined ? "" : `\`${p.default}\``} | ${p.description} |`).join("\n"),
    );

  sections.push("## Anatomy", [...parts(c.anatomy)].join("\n"));

  if (c.guidelines.do.length || c.guidelines.dont.length) sections.push("## Do", list(c.guidelines.do), "## Don't", list(c.guidelines.dont));

  const a11y = [
    `Contrast ${c.a11y.contrast}${c.a11y.minHitArea ? `, hit area ${c.a11y.minHitArea}px` : ""}${c.a11y.focusVisible ? ", visible focus" : ""}.`,
    ...c.a11y.keyboard.map((k) => `\`${k.key}\`: ${k.action}`),
    ...c.a11y.aria,
  ];
  sections.push("## Accessibility", list(a11y));

  const rel = Object.entries(c.relationships).filter(([, ids]) => ids.length);
  if (rel.length) sections.push("## Relationships", list(rel.map(([k, ids]) => `${k}: ${ids.map((i) => `\`${i}\``).join(", ")}`)));

  sections.push(
    "## Channels",
    list(Object.entries(c.channels).map(([ch, s]) => `${ch}: ${s.support}${s.as ? ` as ${s.as}` : ""}${s.note ? ` (${s.note})` : ""}`)),
  );

  if (c.examples.length)
    sections.push("## Examples", ...c.examples.map((e) => `**${e.name}**\n\n\`\`\`json\n${JSON.stringify(e.tree, null, 2)}\n\`\`\``));

  if (c.resources.length) sections.push("## Resources", list(c.resources.map((r) => `[${r.title}](${r.url})`)));

  return sections.join("\n\n") + "\n";
}
