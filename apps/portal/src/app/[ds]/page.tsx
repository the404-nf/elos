import { getDraft, listVersions } from "@/lib/store.ts";
import { Markdown } from "@/components/markdown.tsx";
import { Card, Link, Stack, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

export default async function Overview({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const [{ catalog, files, updatedAt }, versions] = await Promise.all([getDraft(ds), listVersions(ds)]);
  const readme = typeof files["README.md"] === "string" ? (files["README.md"] as string) : "";
  const themes = ["light", ...catalog.system.themes.map((t) => t.name)];
  const glance: [string, string][] = [
    [`${catalog.tokens.base.length} tokens`, `/${ds}/tokens`],
    [`${catalog.contracts.length} components`, `/${ds}/components`],
    [`${catalog.pages.length} pages`, `/${ds}/pages`],
    [`${themes.length} themes`, `/${ds}/tokens`],
    [versions.length ? `${versions.length} versions, latest v${versions[0]!.version}` : "no versions yet", `/${ds}/versions`],
  ];
  return (
    <>
      <PageHead title={catalog.system.name} description={`Draft last changed ${updatedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`} />
      <Stack direction="row" gap="md" align="center">
        {glance.map(([label, href]) => <Link key={label} href={href} label={label} tone="inherit" />)}
      </Stack>
      <Card padding="lg">{readme ? <Markdown source={readme} /> : <Text tone="secondary" text="No README.md in this system yet." />}</Card>
    </>
  );
}
