import { treeComponents } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { Badge, Card, Link, Nav, NavItem, Render, Stack, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const TONE: Record<string, "neutral" | "success" | "danger"> = { draft: "neutral", stable: "success", deprecated: "danger" };
const title = (s: string) => s.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase());
// An anchor cannot hold anchors: a card whose example renders links stays an article with a linked name.
const ANCHORS = new Set(["ds.link", "ds.breadcrumb", "ds.breadcrumb-item", "ds.nav", "ds.nav-item", "ds.page-head"]);

export default async function Components({ params, searchParams }: { params: Promise<{ ds: string }>; searchParams: Promise<{ category?: string }> }) {
  const [{ ds }, { category }] = await Promise.all([params, searchParams]);
  const { catalog } = await getDraft(ds);
  const counts = new Map<string, number>();
  for (const c of catalog.contracts) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  const shown = category ? catalog.contracts.filter((c) => c.category === category) : catalog.contracts;
  const parts = catalog.contracts.filter((c) => c.relationships.within.length && !c.examples.length).length;
  return (
    <>
      <PageHead
        eyebrow={catalog.system.name}
        title="Components"
        description={`${catalog.contracts.length} contracts. Agents compose screens only from these, so every tree they write is checked against them.`}
      />
      <div className="chips">
        <Nav
          label="Categories"
          orientation="horizontal"
          list={[
            <NavItem key="all" href={`/${ds}/components`} label={`All ${catalog.contracts.length}`} tone="chip" current={!category} />,
            ...[...counts].map(([cat, count]) => <NavItem key={cat} href={`/${ds}/components?category=${cat}`} label={`${title(cat)} ${count}`} tone="chip" current={category === cat} />),
          ]}
        />
        {parts > 0 && <Text as="span" variant="caption" tone="secondary" text={`+ ${n(parts, "part")} used inside these`} />}
      </div>
      <div className="grid grid--library">
        {shown.map((c) => {
          const variants = c.props.filter((p) => typeof p.type === "object").reduce((sum, p) => sum + (p.type as { enum: string[] }).enum.length, 0);
          const sizes = c.props.find((p) => p.name === "size");
          const meta = [n(variants, "variant"), sizes && typeof sizes.type === "object" ? n(sizes.type.enum.length, "size") : null, n(c.states.length, "state")].filter(Boolean).join(" · ");
          const href = `/${ds}/components/${c.id}`;
          const linkCard = !c.examples[0] || ![...treeComponents(c.examples[0].tree)].some((id) => ANCHORS.has(id) || id === "ds.card");
          return (
            <Card key={c.id} as={linkCard ? "a" : "article"} href={linkCard ? href : undefined} interactive={linkCard} padding="lg">
              <Stack gap="sm">
                {/* Previews are pictures here: inert keeps their controls out of the tab order. */}
                <div className="well" inert aria-hidden="true">
                  {c.examples[0] ? <Render tree={c.examples[0].tree} /> : <Text as="span" variant="caption" tone="secondary" text={`Inside ${c.relationships.within.map((w) => w.replace("ds.", "")).join(", ") || "other components"}`} />}
                </div>
                <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                  {linkCard ? <Text as="h2" variant="heading" text={c.name} /> : <Link href={href} label={c.name} tone="inherit" style={{ textDecoration: "none", fontFamily: "var(--font-family-display)", fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-lg)" }} />}
                  <Badge label={c.status} tone={TONE[c.status]} />
                </Stack>
                <Text variant="caption" tone="secondary" text={c.description} />
                <Text as="span" variant="caption" tone="tertiary" text={meta} />
              </Stack>
            </Card>
          );
        })}
      </div>
    </>
  );
}
