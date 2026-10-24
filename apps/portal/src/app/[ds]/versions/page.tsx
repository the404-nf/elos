import { allVersions, diffFiles, getDraft } from "@/lib/store.ts";
import { Button, Card, Dialog, Field, Input, Option, Select, Stack, Table, TableCell, TableRow, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";
import { publishAction, restoreAction } from "./actions.ts";

const when = (d: Date) => d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default async function Versions({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const [{ files, catalog }, versions] = await Promise.all([getDraft(ds), allVersions(ds)]);
  const pendingChanges = versions[0] ? diffFiles(versions[0].files, files).filter((p) => p !== "system.json") : Object.keys(files);
  const publishHere = publishAction.bind(null, ds);
  const restoreHere = restoreAction.bind(null, ds);
  const latest = versions[0];
  const status = !latest
    ? `Not published yet. The first version will snapshot all ${pendingChanges.length} files of the draft.`
    : pendingChanges.length
      ? `${pendingChanges.length} file${pendingChanges.length === 1 ? "" : "s"} changed since v${latest.version}.`
      : `No changes since v${latest.version}.`;

  return (
    <>
      <PageHead eyebrow={catalog.system.name} title="Versions" description="Publishing cuts an immutable snapshot of the draft. Rollback copies an old snapshot, or one file of it, back into the draft; history is never rewritten." />

      <Card heading="h2" title={`Draft · v${catalog.system.version}`}>
        <Stack gap="md">
          <Text text={status} />
          {latest && pendingChanges.length > 0 && (
            <Stack direction="row" gap="sm">
              {pendingChanges.map((p) => <Text key={p} as="span" variant="caption" tone="secondary" text={p} style={{ fontFamily: "var(--font-family-mono)" }} />)}
            </Stack>
          )}
          <form action={publishHere} className="row" style={{ alignItems: "flex-end" }}>
            <Field label="Bump">
              <Select name="bump" defaultValue="patch">
                <Option value="patch" label="Patch" />
                <Option value="minor" label="Minor" />
                <Option value="major" label="Major" />
              </Select>
            </Field>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Field label="Note">
                <Input name="note" placeholder="What changed and why" />
              </Field>
            </div>
            <Button type="submit" label="Publish version" />
          </form>
        </Stack>
      </Card>

      {versions.map((v, i) => {
        const prev = versions[i + 1];
        const changed = prev ? diffFiles(prev.files, v.files) : Object.keys(v.files);
        return (
          <Card heading="h2" key={v.id} title={`v${v.version}`}>
            <Stack gap="md">
              <Stack direction="row" gap="md" align="center" style={{ justifyContent: "space-between" }}>
                <Text as="span" variant="caption" tone="secondary" text={`${when(v.createdAt)}${v.note ? ` · ${v.note}` : ""} · ${changed.length} file${changed.length === 1 ? "" : "s"}${prev ? " changed" : ""}`} />
                <Dialog
                title={`Restore v${v.version} to the draft?`}
                description={`Every file of the draft is replaced by its copy in v${v.version}. Nothing is lost: the current draft can be published first, and history stays as it is.`}
                trigger={<Button label="Restore whole version" variant="secondary" size="sm" />}
                actions={
                  <form action={restoreHere} key="restore">
                    <input type="hidden" name="id" value={v.id} />
                    <Button type="submit" label="Restore" variant="danger" />
                  </form>
                }
              />
              </Stack>
              <div className="scroll-x">
                <Table
                  caption={prev ? `Files changed in v${v.version}` : `Files in v${v.version}`}
                  body={changed.map((p) => (
                    <TableRow key={p}>
                      <TableCell><span style={{ fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-sm)" }}>{p}</span></TableCell>
                      <TableCell align="end">
                        <form action={restoreHere} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={v.id} />
                          <input type="hidden" name="path" value={p} />
                          <Button type="submit" label="Restore this file" variant="ghost" size="sm" />
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                />
              </div>
            </Stack>
          </Card>
        );
      })}
    </>
  );
}
