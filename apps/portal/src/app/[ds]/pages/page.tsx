import { getDraft } from "@/lib/store.ts";
import { Render } from "@/components/elos-client.tsx";

export default async function Pages({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  return (
    <>
      <h1>Pages</h1>
      <p className="muted">Composed screens built only from this system's components. Tokens are previewed against them, and agents learn from them.</p>
      {catalog.pages.map((pg) => (
        <section key={pg.id} style={{ marginTop: 20 }}>
          <h2>{pg.name} <code className="muted" style={{ fontWeight: 400, fontSize: 13 }}>{pg.id}</code></h2>
          <p className="muted" style={{ marginTop: 0 }}>{pg.description}</p>
          <div className="canvas canvas--overlay">
            <Render tree={pg.tree} />
          </div>
        </section>
      ))}
      {catalog.pages.length === 0 && <p className="muted">No page examples yet. Add <code>pages/*.page.json</code> to the system.</p>}
    </>
  );
}
