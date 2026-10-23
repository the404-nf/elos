import { allVersions, diffFiles, getDraft } from "@/lib/store.ts";
import { publishAction, restoreAction } from "./actions.ts";

export default async function Versions({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const [{ files, catalog }, versions] = await Promise.all([getDraft(ds), allVersions(ds)]);
  const pendingChanges = versions[0] ? diffFiles(versions[0].files, files).filter((p) => p !== "system.json") : Object.keys(files);
  const publishHere = publishAction.bind(null, ds);
  const restoreHere = restoreAction.bind(null, ds);

  return (
    <>
      <h1>Versions</h1>
      <p className="muted">
        Publishing cuts an immutable snapshot of the draft. Rollback copies an old snapshot, or one file of it, back into the draft; history is never rewritten.
      </p>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Draft · v{catalog.system.version}</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          {!versions.length
            ? `Not published yet. ${pendingChanges.length} files will go into the first version.`
            : pendingChanges.length
              ? `${pendingChanges.length} file(s) changed since v${versions[0]!.version}: `
              : `No changes since v${versions[0]!.version}.`}
          {versions.length > 0 && pendingChanges.map((p) => <code key={p} style={{ marginRight: 8 }}>{p}</code>)}
        </p>
        <form action={publishHere} className="row">
          <label className="field">Bump
            <select name="bump" defaultValue="patch"><option>patch</option><option>minor</option><option>major</option></select>
          </label>
          <label className="field" style={{ flex: 1 }}>Note<input name="note" placeholder="What changed and why" /></label>
          <button type="submit" className="ds-button__root" data-variant="primary" data-size="md" style={{ alignSelf: "flex-end" }}>
            <span className="ds-button__label">Publish version</span>
          </button>
        </form>
      </section>

      {versions.map((v, i) => {
        const prev = versions[i + 1];
        const changed = prev ? diffFiles(prev.files, v.files) : Object.keys(v.files);
        return (
          <section key={v.id} className="panel" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0 }}>v{v.version}</h2>
                <span className="muted" style={{ fontSize: 13 }}>{v.createdAt.toLocaleString()}{v.note ? ` · ${v.note}` : ""}</span>
              </div>
              <form action={restoreHere}>
                <input type="hidden" name="id" value={v.id} />
                <button type="submit" className="ds-button__root" data-variant="secondary" data-size="sm"><span className="ds-button__label">Restore whole version to draft</span></button>
              </form>
            </div>
            <table className="table" style={{ marginTop: 8 }}>
              <tbody>
                {changed.map((p) => (
                  <tr key={p}>
                    <td><code>{p}</code></td>
                    <td style={{ textAlign: "right" }}>
                      <form action={restoreHere} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="path" value={p} />
                        <button type="submit" className="ds-button__root" data-variant="ghost" data-size="sm"><span className="ds-button__label">Restore this file</span></button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </>
  );
}
