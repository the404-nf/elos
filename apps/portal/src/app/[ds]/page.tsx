import { allVersions, diffFiles, getDraft } from "@/lib/store.ts";
import { Markdown } from "@/components/markdown.tsx";
import { Badge, Card, GoButton, Link, Stack, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export default async function Overview({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const [{ catalog, files, updatedAt }, versions] = await Promise.all([getDraft(ds), allVersions(ds)]);
  const readme = typeof files["README.md"] === "string" ? (files["README.md"] as string) : "";
  const latest = versions[0];
  const changed = latest ? diffFiles(latest.files, files).filter((p) => p !== "system.json") : Object.keys(files);
  const themes = 1 + catalog.system.themes.length;
  const tiles: [number, string, string][] = [
    [catalog.tokens.base.length, "Tokens", `/${ds}/tokens`],
    [catalog.contracts.length, "Components", `/${ds}/components`],
    [catalog.pages.length, "Pages", `/${ds}/pages`],
    [themes, "Themes", `/${ds}/tokens`],
  ];
  const lead = latest
    ? changed.length
      ? `${n(changed.length, "change")} since v${latest.version}, waiting to be published.`
      : `Published as v${latest.version}. The draft has no changes.`
    : `Not published yet. The first version will snapshot all ${n(changed.length, "file")} of the draft.`;
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
          <Card key={label} tone="glass" padding="lg" style={{ minWidth: 150 }}>
            <Stack gap="xs">
              <Text as="span" variant="stat" text={String(count)} />
              <Link href={href} label={label} tone="inherit" style={{ textDecoration: "none", opacity: 0.85 }} />
            </Stack>
          </Card>
        ))}
      />
      <div className="grid grid--home">
        <Card title="What changed" heading="h2">
          <Stack gap="sm">
            {changed.length === 0 && <Text tone="secondary" text="Nothing since the last version." />}
            {changed.slice(0, 6).map((p) => (
              <Stack key={p} direction="row" gap="sm" align="center">
                <Badge label="edited" tone="accent" dot />
                <Text as="code" variant="code" text={p} />
              </Stack>
            ))}
            {changed.length > 6 && <Text variant="caption" tone="secondary" text={`and ${changed.length - 6} more`} />}
            <Link href={`/${ds}/versions`} label="View all" />
          </Stack>
        </Card>
        <Card title="Agent ready" heading="h2">
          <Stack gap="sm">
            <Text variant="heading" text="Claude, Cursor and Codex read the same catalog you edit." />
            <Text as="code" variant="code" text={`claude mcp add ${ds} --transport http http://localhost:3000/api/${ds}/mcp`} style={{ display: "block", padding: "var(--space-inset-md)", borderRadius: "var(--radius-inset)", background: "var(--color-surface-overlay)", overflowX: "auto" }} />
            <Stack direction="row" gap="sm">
              <Link href={`/api/${ds}/catalog`} label="Catalog JSON" />
              <Link href={`/api/${ds}/css`} label="CSS" />
            </Stack>
          </Stack>
        </Card>
        <Card title="Components" heading="h2">
          <Stack gap="sm">
            <Text as="span" variant="stat" text={String(catalog.contracts.length)} />
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
              <Text variant="caption" tone="secondary" text={`last changed ${updatedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`} />
            </Stack>
            {versions.slice(0, 4).map((v) => (
              <Stack key={v.id} direction="row" gap="sm" align="center">
                <Text as="code" variant="code" text={`v${v.version}`} />
                <Text variant="caption" tone="secondary" text={v.note || "published"} />
              </Stack>
            ))}
            <Link href={`/${ds}/versions`} label="All versions" />
          </Stack>
        </Card>
      </div>
    </>
  );
}
