import { getDraft } from "@/lib/store.ts";
import { Badge, Button, Card, Input, Render, Stack, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";
import { nodeList } from "@/lib/compose.ts";
import { createScreen } from "./actions.ts";

export default async function Screens({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  const create = createScreen.bind(null, ds);
  return (
    <>
      <PageHead
        eyebrow={catalog.system.name}
        title="Screens"
        description="Product screens composed on the canvas from this system's components. Each one is a file in the system, so it is versioned, diffed and rolled back with everything else."
        extras={
          <form action={create} style={{ display: "contents" }}>
            <Input name="name" size="sm" placeholder="New screen name" aria-label="New screen name" />
            <Button label="New screen" type="submit" variant="glass" size="sm" />
          </form>
        }
      />
      <div className="grid">
        {catalog.screens.map((s) => (
          <Card key={s.id} as="a" href={`/${ds}/screens/${s.id}`} interactive padding="lg">
            <Stack gap="sm">
              <div className="well" inert aria-hidden="true">
                <Render tree={s.tree} />
              </div>
              <Text as="h2" variant="heading" text={s.name} />
              {s.description && <Text variant="caption" tone="secondary" text={s.description} />}
              <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                <Text as="code" variant="code" tone="tertiary" text={s.id} />
                <Badge label={`${nodeList(s.tree).length} node${nodeList(s.tree).length === 1 ? "" : "s"}`} />
              </Stack>
            </Stack>
          </Card>
        ))}
      </div>
      {catalog.screens.length === 0 && <Card><Text tone="secondary" text="No screens yet. Name one above to open it on the canvas." /></Card>}
    </>
  );
}
