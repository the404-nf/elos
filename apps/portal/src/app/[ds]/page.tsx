import Link from "next/link";
import { getDraft, listVersions } from "@/lib/store.ts";

export default async function Overview({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const [{ catalog, files, updatedAt }, versions] = await Promise.all([getDraft(ds), listVersions(ds)]);
  const readme = typeof files["README.md"] === "string" ? (files["README.md"] as string) : "";
  const stats: [string, string, string][] = [
    ["Tokens", String(catalog.tokens.base.length), `/${ds}/tokens`],
    ["Components", String(catalog.contracts.length), `/${ds}/components`],
    ["Themes", ["light", ...catalog.system.themes.map((t) => t.name)].join(", "), `/${ds}/tokens`],
    ["Versions", versions.length ? `${versions.length}, latest v${versions[0]!.version}` : "none published", `/${ds}/versions`],
  ];
  return (
    <>
      <h1>{catalog.system.name}</h1>
      <p className="muted">Draft last changed {updatedAt.toLocaleString()}.</p>
      <div className="grid" style={{ margin: "20px 0 28px" }}>
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href} className="panel" style={{ textDecoration: "none" }}>
            <div className="muted" style={{ fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
          </Link>
        ))}
      </div>
      <section className="panel">
        <h2>Brand book</h2>
        {/* ponytail: the README as preformatted text; a markdown renderer comes with the governance docs. */}
        <pre style={{ whiteSpace: "pre-wrap", font: "inherit", margin: 0 }}>{readme || "No README.md in this system yet."}</pre>
      </section>
    </>
  );
}
