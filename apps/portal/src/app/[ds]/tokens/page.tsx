import Link from "next/link";
import type { ResolvedToken } from "@elos/contracts";
import { tokenUsage } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { TokenPreview } from "@/components/token-preview.tsx";

const TIER = (t: ResolvedToken) => (t.alias ? "semantic" : t.path.split(".").length <= 3 ? "primitive" : "component");
const GROUP_NOTE: Record<string, string> = {
  color: "Surfaces, text, borders, actions and status. Semantic names carry meaning; primitives are the palette.",
  space: "Spacing scale and the inset and stack roles components bind to.",
  radius: "Corner radii: control for buttons and inputs, container for cards and dialogs.",
  font: "Family, sizes and weights.",
  type: "Typographic roles: title, heading, body, caption.",
};

/** A background/foreground pair drawn as one swatch with text on it. */
function Pair({ bg, fg }: { bg: ResolvedToken; fg: ResolvedToken }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 36, borderRadius: 6, background: bg.value, color: fg.value, border: "1px solid var(--color-border-subtle)", fontWeight: 600, fontSize: 13 }} title={`${bg.path} / ${fg.path}`}>
      Aa
    </span>
  );
}

export default async function Tokens({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  const usage = tokenUsage(catalog);
  const dark = new Map((catalog.tokens.dark ?? []).map((t) => [t.path, t]));
  const usedBy = (t: ResolvedToken) => [...new Set((usage.get(t.path) ?? []).map((u) => u.split(" ")[0]!.replace("ds.", "")))].join(", ");

  // Groups by first segment; color is further grouped by role, with background/foreground pairs collapsed to one row.
  const groups = new Map<string, ResolvedToken[]>();
  for (const t of catalog.tokens.base) groups.set(t.path.split(".")[0]!, [...(groups.get(t.path.split(".")[0]!) ?? []), t]);

  const Row = ({ t }: { t: ResolvedToken }) => {
    const d = dark.get(t.path);
    const darkDiffers = d && (d.alias !== t.alias || d.value !== t.value);
    return (
      <tr>
        <td><TokenPreview token={t} /></td>
        <td data-theme="dark" style={{ background: darkDiffers ? "var(--color-surface-canvas)" : undefined, borderRadius: 8 }}>
          {darkDiffers && d ? <TokenPreview token={d} /> : <span className="muted" style={{ fontSize: 12 }}>same</span>}
        </td>
        <td>
          <Link href={`/${ds}/tokens/${t.path}`}><code>{t.path}</code></Link>
          {t.description && <div className="muted" style={{ fontSize: 13 }}>{t.description}</div>}
        </td>
        <td>
          <code>{t.alias ? `{${t.alias}}` : t.value}</code>{t.alias && <span className="muted"> → {t.value}</span>}
          {darkDiffers && d && <div className="muted" style={{ fontSize: 12 }}>dark: <code>{d.alias ? `{${d.alias}}` : d.value}</code></div>}
        </td>
        <td className="muted">{TIER(t)}</td>
        <td className="muted" style={{ fontSize: 13 }}>{usedBy(t)}</td>
      </tr>
    );
  };

  const PairRow = ({ name, bg, fg }: { name: string; bg: ResolvedToken; fg: ResolvedToken }) => {
    const dbg = dark.get(bg.path) ?? bg, dfg = dark.get(fg.path) ?? fg;
    return (
      <tr>
        <td><Pair bg={bg} fg={fg} /></td>
        <td data-theme="dark" style={{ background: "var(--color-surface-canvas)", borderRadius: 8 }}><Pair bg={dbg} fg={dfg} /></td>
        <td>
          <strong>{name}</strong>
          <div style={{ fontSize: 13 }}>
            <Link href={`/${ds}/tokens/${bg.path}`}><code>{bg.path.split(".").pop()}</code></Link> · <Link href={`/${ds}/tokens/${fg.path}`}><code>{fg.path.split(".").pop()}</code></Link>
          </div>
        </td>
        <td><code>{bg.value}</code> on <code>{fg.value}</code></td>
        <td className="muted">semantic</td>
        <td className="muted" style={{ fontSize: 13 }}>{usedBy(bg)}</td>
      </tr>
    );
  };

  const head = (
    <thead><tr><th style={{ width: 64 }}>Light</th><th style={{ width: 64 }}>Dark</th><th>Token</th><th>Value</th><th>Tier</th><th>Used by</th></tr></thead>
  );

  return (
    <>
      <h1>Tokens</h1>
      <p className="muted">{catalog.tokens.base.length} tokens in {groups.size} groups. Primitives hold raw values; semantic tokens alias them and are what components bind to.</p>
      {[...groups].map(([group, tokens]) => {
        if (group !== "color") {
          return (
            <section key={group} className="panel" style={{ marginTop: 16 }}>
              <h2 style={{ textTransform: "capitalize" }}>{group}</h2>
              {GROUP_NOTE[group] && <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>{GROUP_NOTE[group]}</p>}
              <table className="table">{head}<tbody>{tokens.map((t) => <Row key={t.path} t={t} />)}</tbody></table>
            </section>
          );
        }
        // Color: primitives by hue; semantic by role; action/status tones as pairs.
        const roles = new Map<string, ResolvedToken[]>();
        for (const t of tokens) {
          const role = t.alias || t.path.split(".").length > 3 ? t.path.split(".")[1]! : "palette";
          roles.set(role, [...(roles.get(role) ?? []), t]);
        }
        return (
          <section key={group} className="panel" style={{ marginTop: 16 }}>
            <h2>Color</h2>
            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>{GROUP_NOTE.color}</p>
            {[...roles].map(([role, list]) => {
              const byPath = new Map(list.map((t) => [t.path, t]));
              const pairs = list.filter((t) => t.path.endsWith(".background") && byPath.has(t.path.replace(/\.background$/, ".foreground")));
              const paired = new Set(pairs.flatMap((t) => [t.path, t.path.replace(/\.background$/, ".foreground")]));
              return (
                <div key={role} style={{ marginTop: 14 }}>
                  <h3 style={{ textTransform: "capitalize" }}>{role}</h3>
                  <table className="table">
                    {head}
                    <tbody>
                      {pairs.map((bg) => <PairRow key={bg.path} name={bg.path.split(".").slice(2, -1).join(".")} bg={bg} fg={byPath.get(bg.path.replace(/\.background$/, ".foreground"))!} />)}
                      {list.filter((t) => !paired.has(t.path)).map((t) => <Row key={t.path} t={t} />)}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
