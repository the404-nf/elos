import { getDraft } from "@/lib/store.ts";
import { Card, Render, Text } from "@/components/elos-client.tsx";
import { CopyButton } from "@/components/copy-button.tsx";
import { PageHead } from "@/components/page-head.tsx";

export default async function Pages({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  return (
    <>
      <PageHead eyebrow={catalog.system.name} title="Pages" description="Composed screens built only from this system's components. Tokens are previewed against them, and agents learn from them." />
      {catalog.pages.map((pg) => (
        <Card key={pg.id} id={pg.id} title={pg.name} heading="h2" meta={<><Text as="code" variant="code" tone="secondary" text={pg.id} /><CopyButton label="Copy tree" text={JSON.stringify(pg.tree, null, 2)} /></>}>
          <Text variant="caption" tone="secondary" text={pg.description} />
          <div className="canvas canvas--overlay">
            <Render tree={pg.tree} />
          </div>
        </Card>
      ))}
      {catalog.pages.length === 0 && <Card><Text tone="secondary" text="No page examples yet. Add pages/*.page.json to the system." /></Card>}
    </>
  );
}
