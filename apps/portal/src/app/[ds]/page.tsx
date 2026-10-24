import { allVersions, diffFiles, getDraft } from "@/lib/store.ts";
import { Markdown } from "@/components/markdown.tsx";
import { Badge, Card, GoButton, Link, Render, Stack, Table, TableCell, TableRow, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export default async function Overview({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const [{ catalog, files, updatedAt }, versions] = await Promise.all([getDraft(ds), allVersions(ds)]);
  const readme = typeof files["README.md"] === "string" ? (files["README.md"] as string) : "";
  const latest = versions[0];
  const changed = latest ? diffFiles(latest.files, files).filter((p) => p !== "system.json") : Object.keys(files);
  const kind = (p: string) => (latest && !(p in latest.files) ? "added" : !(p in files) ? "removed" : "edited");
  const themes = 1 + catalog.system.themes.length;
  const tiles: [number, string, string][] = [
    [catalog.tokens.base.length, "Tokens", `/${ds}/tokens`],
    [catalog.contracts.length, "Components", `/${ds}/components`],
    [catalog.pages.length, "Pages", `/${ds}/pages`],
    [themes, "Themes", `/${ds}/tokens`],
  ];
  const lead = latest
    ? changed.length
      ? `Calm, precise components. ${n(changed.length, "change")} since v${latest.version}, waiting to be published.`
      : `Calm, precise components. Published as v${latest.version}; the draft has no changes.`
    : `Calm, precise components. Not published yet: the first version will snapshot all ${n(changed.length, "file")} of the draft.`;
  return (
    <>
      <PageHead
        variant="display"
        eyebrow={`Design system · ${latest ? `v${latest.version}` : "draft"}`}
        title={catalog.system.name}
        description={lead}
        actions={
          <>
            <GoButton href={`/${ds}/versions`} label={latest ? "Publish" : "Publish v0.1.0"} />
            <GoButton href={`/${ds}/versions`} label="Review changes" variant="glass" />
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
        <Card title="What changed" heading="h2">
          <Stack gap="sm">
            {changed.length === 0 && <Text tone="secondary" text="Nothing since the last version." />}
            {changed.length > 0 && (
              <Table
                caption="Files changed since the last version"
                body={changed.slice(0, 6).map((p) => (
                  <TableRow key={p}>
                    <TableCell>
                      <Stack direction="row" gap="sm" align="center">
                        <Badge label={kind(p)} tone="accent" dot />
                        <Text as="code" variant="code" text={p.replace(/\.(contract|page)\.json$/, "")} />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              />
            )}
            {changed.length > 6 && <Text variant="caption" tone="secondary" text={`and ${n(changed.length - 6, "more file")}`} />}
            <Link href={`/${ds}/versions`} label="View diff" />
          </Stack>
        </Card>
        <Card title="Agent ready" heading="h2" featured>
          <Stack gap="md">
            <Text variant="title" text="Claude, Cursor and Codex read the same catalog you edit." />
            <Text as="code" variant="code" text={`claude mcp add ${ds} --transport http http://localhost:3000/api/${ds}/mcp`} style={{ display: "block", padding: "var(--space-inset-md)", borderRadius: "var(--radius-inset)", background: "var(--color-surface-overlay)", overflowX: "auto" }} />
            <Stack direction="row" gap="md">
              <Link href={`/api/${ds}/catalog`} label="Catalog JSON" />
              <Link href={`/api/${ds}/css`} label="CSS" />
            </Stack>
          </Stack>
        </Card>
        <Card title="Components" heading="h2">
          <Stack gap="md">
            <Text as="span" variant="stat" text={String(catalog.contracts.length)} />
            <div className="well" inert aria-hidden="true">
              <Render tree={{ component: "ds.stack", props: { direction: "row", gap: "md", align: "center" }, slots: { root: [
                { component: "ds.button", props: { label: "Save", size: "sm" } },
                { component: "ds.switch", props: { label: "", checked: true } },
                { component: "ds.badge", props: { label: "Published", tone: "accent", dot: true } },
              ] } }} />
            </div>
            <Stack direction="row" gap="xs">
              {(["draft", "stable", "deprecated"] as const).map((s) => {
                const count = catalog.contracts.filter((c) => c.status === s).length;
                return count ? <Badge key={s} label={`${count} ${s}`} tone={s === "stable" ? "success" : s === "deprecated" ? "danger" : "neutral"} /> : null;
              })}
            </Stack>
            <Link href={`/${ds}/components`} label="Open the library" />
          </Stack>
        </Card>
      </div>
      <div className="grid grid--wide">
        <Card title="Brand book" heading="h2">{readme ? <Markdown source={readme} /> : <Text tone="secondary" text="No README.md in this system yet." />}</Card>
        <Card title="Versions" heading="h2">
          <Stack gap="sm">
            <Stack direction="row" gap="sm" align="center">
              <Badge label="Draft" tone="accent" dot />
              <Text variant="caption" tone="secondary" text={`${n(changed.length, "change")} · last edited ${updatedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`} />
            </Stack>
            {versions.slice(0, 4).map((v) => (
              <Stack key={v.id} direction="row" gap="sm" align="center">
                <Text as="code" variant="code" text={`v${v.version}`} />
                <Text variant="caption" tone="secondary" text={`${v.note || "published"} · ${v.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}`} />
              </Stack>
            ))}
            <Link href={`/${ds}/versions`} label="All versions" />
          </Stack>
        </Card>
      </div>
    </>
  );
}
