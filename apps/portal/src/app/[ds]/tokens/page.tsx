import Link from "next/link";
import { tokenUsage } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";

const TIER = (path: string, alias?: string) => (alias ? "semantic" : path.split(".").length <= 3 ? "primitive" : "component");

export default async function Tokens({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  const usage = tokenUsage(catalog);
  const dark = new Map((catalog.tokens.dark ?? []).map((t) => [t.path, t]));
  const groups = new Map<string, typeof catalog.tokens.base>();
  for (const t of catalog.tokens.base) {
    const g = t.path.split(".")[0]!;
    groups.set(g, [...(groups.get(g) ?? []), t]);
  }
  return (
    <>
      <h1>Tokens</h1>
      <p className="muted">
        {catalog.tokens.base.length} tokens in {groups.size} groups. Primitives hold raw values; semantic tokens alias them and are what components bind to.
      </p>
      {[...groups].map(([group, tokens]) => (
        <section key={group} className="panel" style={{ marginTop: 16 }}>
          <h2>{group}</h2>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Token</th>
                <th>Value</th>
                <th>Dark</th>
                <th>Tier</th>
                <th>Used by</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => {
                const d = dark.get(t.path);
                const uses = usage.get(t.path) ?? [];
                return (
                  <tr key={t.path}>
                    <td>{t.type === "color" && <span className="swatch" style={{ background: t.value }} />}</td>
                    <td>
                      <Link href={`/${ds}/tokens/${t.path}`}>
                        <code>{t.path}</code>
                      </Link>
                      {t.description && <div className="muted" style={{ fontSize: 13 }}>{t.description}</div>}
                    </td>
                    <td>
                      <code>{t.alias ? `{${t.alias}}` : t.value}</code>
                      {t.alias && <span className="muted"> → {t.value}</span>}
                    </td>
                    <td className="muted">{d && (d.alias !== t.alias || d.value !== t.value) ? <code>{d.alias ? `{${d.alias}}` : d.value}</code> : ""}</td>
                    <td className="muted">{TIER(t.path, t.alias)}</td>
                    <td className="muted">{uses.length ? `${new Set(uses.map((u) => u.split(" ")[0])).size} components` : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
