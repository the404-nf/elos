import Link from "next/link";
import { getDraft } from "@/lib/store.ts";
import { Badge, Render } from "@/components/elos-client.tsx";

const TONE: Record<string, "neutral" | "success" | "danger"> = { draft: "neutral", stable: "success", deprecated: "danger" };

export default async function Components({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  const byCategory = new Map<string, typeof catalog.contracts>();
  for (const c of catalog.contracts) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
  return (
    <>
      <h1>Components</h1>
      <p className="muted">{catalog.contracts.length} contracts. Click one to preview, inspect and edit it.</p>
      {[...byCategory].map(([category, contracts]) => (
        <section key={category} style={{ marginTop: 20 }}>
          <h2 style={{ textTransform: "capitalize" }}>{category}</h2>
          <div className="grid">
            {contracts.map((c) => (
              <Link key={c.id} href={`/${ds}/components/${c.id}`} className="panel" style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{c.name}</strong>
                  <Badge label={c.status} tone={TONE[c.status]} />
                </div>
                <span className="muted" style={{ fontSize: 13 }}>{c.description}</span>
                <div className="canvas" style={{ minHeight: 72, padding: 12, overflow: "hidden", pointerEvents: "none" }}>
                  {c.examples[0] ? <Render tree={c.examples[0].tree} /> : <span className="muted" style={{ fontSize: 12 }}>Used inside {c.relationships.within.join(", ") || "other components"}</span>}
                </div>
                <code className="muted" style={{ fontSize: 12 }}>{c.id}</code>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
