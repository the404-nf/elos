import Link from "next/link";
import { listSystems, listVersions } from "@/lib/store.ts";
import { listProjects } from "@/lib/canvas-store.ts";
import { createProjectAction } from "./canvas/actions.ts";

export const dynamic = "force-dynamic";

// The Elos home follows the founder's drawing (docs/architecture.png): three areas, Serve underneath. Outside a system
// there is no catalog to compose from, so this one screen uses the fallback variables in globals.css.
export default async function Home() {
  const systems = await listSystems();
  const [projects, versions] = await Promise.all([listProjects(), Promise.all(systems.map(async (s) => [s.id, await listVersions(s.id)] as const))]);
  const bindings = systems.flatMap((s) => [`${s.id}@draft`, ...(versions.find(([id]) => id === s.id)?.[1] ?? []).map((v) => `${s.id}@${v.version}`)]);
  return (
    <main className="home">
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-semibold)" }}>Elos</h1>
        <p className="muted" style={{ margin: 0 }}>Design systems, stored for people and agents.</p>
      </div>
      <div className="areas">
        <section className="area">
          <h2>Design Systems</h2>
          <p>See a system, inspect and edit every token and component, version the elements and the system itself.</p>
          {systems.map((s) => (
            <Link key={s.id} href={`/${s.id}`} className="row"><strong>{s.name}</strong><span className="caption">{s.id}</span></Link>
          ))}
        </section>
        <section className="area">
          <h2>Marketplace</h2>
          <p>Governed assets teams consume: design principles, design decision records, agents, skills. Phase 3.</p>
        </section>
        <section className="area">
          <h2>Canvas</h2>
          <p>Build screens and journeys with a system and your own model, on a board.</p>
          {projects.map((p) => {
            const m = p.files["project.json"] as { system: { id: string; version: string } };
            return <Link key={p.id} href={`/canvas/${p.id}`} className="row"><strong>{p.name}</strong><span className="caption">{m.system.id} · {m.system.version}</span></Link>;
          })}
          <form action={createProjectAction}>
            <input name="name" placeholder="New project name" aria-label="New project name" required />
            <select name="binding" aria-label="Design system and version">
              {bindings.map((b) => <option key={b} value={b}>{b.replace("@", " · ")}</option>)}
            </select>
            <button type="submit">New project</button>
          </form>
        </section>
      </div>
      <p className="caption">Serve: REST, MCP, exports and skills reach every area from here.</p>
    </main>
  );
}
