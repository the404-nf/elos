import Link from "next/link";
import { tokenUsage } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { TokenPreview } from "@/components/token-preview.tsx";

const TIER = (path: string, alias?: string) => (alias ? "semantic" : path.split(".").length <= 3 ? "primitive" : "component");
const GROUP_NOTE: Record<string, string> = {
  color: "Surfaces, text, borders, actions and status. Semantic names carry meaning; primitives are the palette.",
  space: "Spacing scale and the inset and stack roles components bind to.",
  radius: "Corner radii: control for buttons and inputs, container for cards and dialogs.",
  font: "Family, sizes and weights.",
  type: "Typographic roles: title, heading, body, caption.",
};

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
          <h2 style={{ textTransform: "capitalize" }}>{group}</h2>
          {GROUP_NOTE[group] && <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>{GROUP_NOTE[group]}</p>}
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Light</th>
                {dark.size > 0 && <th style={{ width: 56 }}>Dark</th>}
                <th>Token</th>
                <th>Value</th>
                <th>Tier</th>
                <th>Used by</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => {
                const d = dark.get(t.path);
                const darkDiffers = d && (d.alias !== t.alias || d.value !== t.value);
                const uses = [...new Set((usage.get(t.path) ?? []).map((u) => u.split(" ")[0]))];
                return (
                  <tr key={t.path}>
                    <td><TokenPreview token={t} /></td>
                    {dark.size > 0 && (
                      <td data-theme="dark" style={{ background: darkDiffers ? "var(--color-surface-canvas)" : undefined, borderRadius: 8 }}>
                        {darkDiffers && d ? <TokenPreview token={d} /> : <span className="muted" style={{ fontSize: 12 }}>same</span>}
                      </td>
                    )}
                    <td>
                      <Link href={`/${ds}/tokens/${t.path}`}><code>{t.path}</code></Link>
                      {t.description && <div className="muted" style={{ fontSize: 13 }}>{t.description}</div>}
                    </td>
                    <td>
                      <code>{t.alias ? `{${t.alias}}` : t.value}</code>
                      {t.alias && <span className="muted"> → {t.value}</span>}
                      {darkDiffers && d && <div className="muted" style={{ fontSize: 12 }}>dark: <code>{d.alias ? `{${d.alias}}` : d.value}</code></div>}
                    </td>
                    <td className="muted">{TIER(t.path, t.alias)}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{uses.map((u) => u.replace("ds.", "")).join(", ")}</td>
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
