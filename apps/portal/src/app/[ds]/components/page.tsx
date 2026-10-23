import { getDraft } from "@/lib/store.ts";
import { Badge, Card, Link, Render, Stack, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const TONE: Record<string, "neutral" | "success" | "danger"> = { draft: "neutral", stable: "success", deprecated: "danger" };

export default async function Components({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  const byCategory = new Map<string, typeof catalog.contracts>();
  for (const c of catalog.contracts) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
  return (
    <>
      <PageHead title="Components" description={`${catalog.contracts.length} contracts in ${byCategory.size} categories. Open one to preview, inspect and edit it.`} />
      {[...byCategory].map(([category, contracts]) => (
        <Stack key={category} gap="sm">
          <Text as="h2" variant="heading" text={category.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase())} />
          <div className="grid">
            {contracts.map((c) => {
              const variants = c.props.filter((p) => typeof p.type === "object").reduce((n, p) => n + (p.type as { enum: string[] }).enum.length, 0);
              const native = Object.entries(c.channels).filter(([, s]) => s.support === "native").map(([ch]) => ch);
              const rest = Object.entries(c.channels).filter(([, s]) => s.support !== "native").map(([ch, s]) => `${ch} ${s.support}`);
              return (
                <Card key={c.id}>
                  <Stack gap="sm">
                    <Stack direction="row" gap="sm" align="center">
                      <Link href={`/${ds}/components/${c.id}`} label={c.name} tone="inherit" style={{ fontWeight: "var(--font-weight-semibold)", textDecoration: "none" }} />
                      <Badge label={c.status} tone={TONE[c.status]} />
                    </Stack>
                    <Text variant="caption" tone="secondary" text={c.description} />
                    {/* Previews are pictures here: inert keeps their links and controls out of the tab order and the outline. */}
                    <div className="canvas canvas--thumb" inert aria-hidden="true">
                      {c.examples[0] ? <Render tree={c.examples[0].tree} /> : <Text as="span" variant="caption" tone="secondary" text={`Used inside ${c.relationships.within.join(", ") || "other components"}`} />}
                    </div>
                    <Text as="span" variant="caption" tone="secondary" text={`${n(variants, "variant")} · ${n(c.examples.length, "example")} · native on ${native.join(", ") || "none"}${rest.length ? `; ${rest.join(", ")}` : ""}`} />
                  </Stack>
                </Card>
              );
            })}
          </div>
        </Stack>
      ))}
    </>
  );
}
