import { allVersions, diffFiles, getDraft } from "@/lib/store.ts";
import { Badge, Card, GoButton, Icon, Link, Render, Stack, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const when = (d: Date) => d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default async function Overview({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const [{ catalog, files, updatedAt }, versions] = await Promise.all([getDraft(ds), allVersions(ds)]);
  const latest = versions[0];
  const changed = latest ? diffFiles(latest.files, files).filter((p) => p !== "system.json") : [];
  const kind = (p: string) => (latest && !(p in latest.files) ? "added" : !(p in files) ? "removed" : "edited");
  const tiles: [number, string, string][] = [
    [catalog.tokens.base.length, "Tokens", `/${ds}/tokens`],
    [catalog.contracts.length, "Components", `/${ds}/components`],
    [catalog.pages.length, "Pages", `/${ds}/pages`],
    [catalog.screens.length, "Screens", `/${ds}/screens`],
    [1 + catalog.system.themes.length, "Themes", `/${ds}/tokens`],
  ];
  const lead = latest
    ? changed.length
      ? `Calm, precise components. ${n(changed.length, "change")} waiting to be published after v${latest.version}.`
      : `Calm, precise components. Published as v${latest.version}; the draft has no changes.`
    : "Calm, precise components. Not published yet: the first version snapshots the whole draft.";
  const zag = catalog.contracts.filter((c) => c.behavior).length;
  return (
    <>
      <PageHead
        variant="display"
        eyebrow={`Design system · ${latest && !changed.length ? `v${latest.version}` : "draft"}`}
        title={catalog.system.name}
        description={lead}
        actions={
          <>
            <GoButton href={`/${ds}/versions`} label={latest ? "Publish" : "Publish v0.1.0"} size="lg" icon={<Icon name="arrow-right" size="sm" />} />
            <GoButton href={`/${ds}/versions`} label="Review changes" variant="glass" size="lg" />
          </>
        }
        extras={tiles.map(([count, label, href]) => (
          <Card key={label} tone="glass" padding="lg" as="a" href={href}>
            <Stack gap="xs">
              <Text as="span" variant="stat" text={String(count)} />
              <Text as="span" variant="label" text={label} style={{ opacity: 0.85 }} />
            </Stack>
          </Card>
        ))}
      />
      <div className="grid grid--home">
        <Card title="What changed" heading="h2" meta={<Link href={`/${ds}/versions`} label="View diff" tone="inherit" />}>
          <Stack gap="xs">
            {changed.length === 0 && <Text tone="secondary" text={latest ? "Nothing since the last version." : "Everything: the draft has not been published yet."} />}
            {changed.slice(0, 5).map((p) => (
              <div key={p} className="li">
                <Badge label={kind(p)} tone="accent" dot />
                <Text as="code" variant="code" text={p.replace(/\.(contract|page)\.json$/, "").replace(/^contracts\//, "")} />
              </div>
            ))}
            {changed.length > 5 && <Text variant="caption" tone="tertiary" text={`and ${n(changed.length - 5, "more file")}`} />}
          </Stack>
        </Card>
        <Card heading="h2" featured title="Agent ready" meta={<Link href={`/api/${ds}/catalog`} label="Catalog" tone="inherit" />}>
          <Stack gap="md">
            <Text variant="title" text="Claude, Cursor and Codex read the same catalog you edit." />
            <Text as="code" variant="code" text={`claude mcp add ${ds} --transport http http://localhost:3000/api/${ds}/mcp`} style={{ display: "block", padding: "var(--space-inset-md)", borderRadius: "var(--radius-inset)", background: "var(--color-surface-overlay)", overflowX: "auto" }} />
          </Stack>
        </Card>
        <Card title="Components" heading="h2" meta={<Link href={`/${ds}/components`} label={String(catalog.contracts.length)} tone="inherit" />}>
          <div className="minis" inert aria-hidden="true">
            <div><Render tree={{ component: "ds.button", props: { label: "Save", size: "sm" } }} /></div>
            <div><Render tree={{ component: "ds.switch", props: { label: "", checked: true } }} /></div>
            <div><Render tree={{ component: "ds.badge", props: { label: "Published", tone: "accent", dot: true } }} /></div>
            <div><Render tree={{ component: "ds.stack", props: { direction: "row", gap: "xs" }, slots: { root: [{ component: "ds.avatar", props: { name: "Lê", initials: "LÊ", size: "sm" } }, { component: "ds.avatar", props: { name: "JD", initials: "JD", size: "sm" } }, { component: "ds.avatar", props: { name: "3 more", initials: "+3", size: "sm" } }] } }} /></div>
          </div>
        </Card>
      </div>
      <div className="grid grid--wide">
        <Card title="Pages" heading="h2" meta={<Link href={`/${ds}/pages`} label="All pages" tone="inherit" />}>
          <Stack gap="xs">
            {catalog.pages.map((pg) => (
              <Link key={pg.id} href={`/${ds}/pages#${pg.id}`} tone="inherit" label={pg.name} style={{ textDecoration: "none" }} />
            ))}
            {catalog.pages.length === 0 && <Text tone="secondary" text="No page examples yet." />}
            <Text variant="caption" tone="secondary" text={`${n(catalog.contracts.length, "contract")}, ${n(zag, "behavior")} on Zag, ${n(catalog.pages.length, "page example")} agents learn from.`} />
          </Stack>
        </Card>
        <Card title="Versions" heading="h2" meta={<Link href={`/${ds}/versions`} label="All versions" tone="inherit" />}>
          <div className="tl">
            <div className="tl-now">
              <Text as="span" variant="label" text="Draft" />
              <Text variant="caption" tone="secondary" text={`${changed.length ? n(changed.length, "change") : "no changes"}, last edited ${when(updatedAt)}`} />
            </div>
            {versions.slice(0, 3).map((v) => (
              <div key={v.id}>
                <Text as="span" variant="label" text={`v${v.version}`} />
                <Text variant="caption" tone="secondary" text={`Published ${when(v.createdAt)}${v.note ? ` · ${v.note}` : ""}`} />
              </div>
            ))}
            <div>
              <Text as="span" variant="label" text="Seeded" />
              <Text variant="caption" tone="secondary" text={`From the ${catalog.system.name} directory`} />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
