import Link from "next/link";
import { listSystems } from "@/lib/store.ts";

export const dynamic = "force-dynamic";

// Outside a system there is no catalog to compose from, so this one screen uses the fallback variables in globals.css.
export default async function Home() {
  const systems = await listSystems();
  return (
    <main className="main" style={{ margin: "0 auto", maxWidth: 720 }}>
      <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-semibold)" }}>Elos</h1>
      <p className="muted" style={{ margin: 0 }}>Design systems, stored for people and agents.</p>
      <div className="grid">
        {systems.map((s) => (
          <Link key={s.id} href={`/${s.id}`} style={{ textDecoration: "none", background: "var(--color-surface-raised)", border: "var(--border-width) solid var(--color-border-subtle)", borderRadius: "var(--radius-container)", padding: "var(--space-inset-lg)" }}>
            <strong>{s.name}</strong>
            <div className="caption">{s.id}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
