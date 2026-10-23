import Link from "next/link";
import { listSystems } from "@/lib/store.ts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const systems = await listSystems();
  return (
    <main className="main" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1>Elos</h1>
      <p className="muted">Design systems, stored for people and agents.</p>
      <div className="grid" style={{ marginTop: 24 }}>
        {systems.map((s) => (
          <Link key={s.id} href={`/${s.id}`} className="panel" style={{ textDecoration: "none" }}>
            <h2>{s.name}</h2>
            <span className="muted">{s.id}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
