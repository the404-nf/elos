import { getDraft } from "@/lib/store.ts";
import { Render, Stack, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

export default async function Pages({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  return (
    <>
      <PageHead title="Pages" description="Composed screens built only from this system's components. Tokens are previewed against them, and agents learn from them." />
      {catalog.pages.map((pg) => (
        <Stack key={pg.id} gap="sm">
          <Stack direction="row" gap="sm" align="center">
            <Text as="h2" variant="heading" text={pg.name} />
            <Text as="span" variant="caption" tone="secondary" text={pg.id} style={{ fontFamily: "var(--font-family-mono)" }} />
          </Stack>
          <Text variant="caption" tone="secondary" text={pg.description} />
          <div className="canvas canvas--overlay">
            <Render tree={pg.tree} />
          </div>
        </Stack>
      ))}
      {catalog.pages.length === 0 && <Text tone="secondary" text="No page examples yet. Add pages/*.page.json to the system." />}
    </>
  );
}
