import { treeComponents } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { Badge, Card, Input, Link, Nav, NavItem, Render, Stack, Text } from "@/components/elos-client.tsx";
import { CopyButton } from "@/components/copy-button.tsx";
import { PageHead } from "@/components/page-head.tsx";

const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const TONE: Record<string, "neutral" | "success" | "danger" | "accent"> = { draft: "accent", stable: "success", deprecated: "danger" };
const title = (s: string) => s.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase());
// An anchor cannot hold anchors: a card whose example renders links stays an article with a linked name.
const ANCHORS = new Set(["ds.link", "ds.breadcrumb", "ds.breadcrumb-item", "ds.nav", "ds.nav-item", "ds.page-head", "ds.card"]);

export default async function Components({ params, searchParams }: { params: Promise<{ ds: string }>; searchParams: Promise<{ category?: string; q?: string }> }) {
  const [{ ds }, { category, q = "" }] = await Promise.all([params, searchParams]);
  const { catalog } = await getDraft(ds);
  const query = q.trim().toLowerCase();
  const counts = new Map<string, number>();
  for (const c of catalog.contracts) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  const shown = catalog.contracts.filter((c) => (!category || c.category === category) && (!query || [c.name, c.id, c.description, ...c.usage.intents].some((s) => s.toLowerCase().includes(query))));
  const parts = catalog.contracts.filter((c) => c.relationships.within.length && !c.examples.length).length;
  const href = (cat?: string) => {
    const qs = new URLSearchParams({ ...(cat ? { category: cat } : {}), ...(query ? { q: query } : {}) }).toString();
    return `/${ds}/components${qs ? `?${qs}` : ""}`;
  };
  return (
    <>
      <PageHead
        eyebrow={catalog.system.name}
        title="Components"
        description={`${catalog.contracts.length} contracts. Agents compose screens only from these, so every tree they write is checked against them.`}
        actions={<CopyButton label="Copy catalog for agent" text={`claude mcp add ${ds} --transport http http://localhost:3000/api/${ds}/mcp`} variant="glass" size="md" icon />}
      />
      <div className="toolbar">
        <Nav
          label="Categories"
          orientation="horizontal"
          list={[
            <NavItem key="all" href={href()} label="All" meta={String(catalog.contracts.length)} tone="chip" current={!category} />,
            ...[...counts].map(([cat, count]) => <NavItem key={cat} href={href(cat)} label={title(cat)} meta={String(count)} tone="chip" current={category === cat} />),
          ]}
        />
        {parts > 0 && <Text as="span" variant="caption" tone="secondary" text={`+ ${n(parts, "part")} used inside these`} />}
        <form method="get" action={`/${ds}/components`} style={{ flex: "0 1 260px", marginLeft: "auto" }}>
          {category && <input type="hidden" name="category" value={category} />}
          <Input type="search" name="q" defaultValue={q} placeholder="Find by intent" aria-label="Find a component by name or intent" size="sm" />
        </form>
      </div>
      <div className="grid grid--library">
        {shown.map((c) => {
          const variants = c.props.filter((p) => typeof p.type === "object").reduce((sum, p) => sum + (p.type as { enum: string[] }).enum.length, 0);
          const sizes = c.props.find((p) => p.name === "size");
          const meta = [n(variants, "variant"), sizes && typeof sizes.type === "object" ? n(sizes.type.enum.length, "size") : null, n(c.examples.length, "example")].filter(Boolean).join(" · ");
          const to = `/${ds}/components/${c.id}`;
          const linkCard = !c.examples[0] || ![...treeComponents(c.examples[0].tree)].some((id) => ANCHORS.has(id));
          return (
            <Card key={c.id} as={linkCard ? "a" : "article"} href={linkCard ? to : undefined} interactive={linkCard} padding="lg">
              <Stack gap="sm">
                <div className="well" inert aria-hidden="true">
                  {c.examples[0] ? <Render tree={c.examples[0].tree} /> : <Text as="span" variant="caption" tone="secondary" text={`Inside ${c.relationships.within.map((w) => w.replace("ds.", "")).join(", ") || "other components"}`} />}
                </div>
                <Stack direction="row" gap="sm" align="center">
                  {linkCard ? <Text as="h2" variant="heading" text={c.name} /> : <Link href={to} label={c.name} tone="inherit" style={{ textDecoration: "none", fontFamily: "var(--font-family-display)", fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-lg)" }} />}
                  {c.behavior && <Badge label="Zag" tone="neutral" />}
                </Stack>
                <Text variant="caption" tone="secondary" text={c.description} />
                <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                  <Text as="span" variant="caption" tone="tertiary" text={meta} />
                  <Badge label={c.status} tone={TONE[c.status]} dot={c.status === "draft"} />
                </Stack>
              </Stack>
            </Card>
          );
        })}
        {shown.length === 0 && <Card><Text tone="secondary" text={`Nothing matches "${q}". Agents search the same intents: try submit, confirm, empty state.`} /></Card>}
      </div>
    </>
  );
}
