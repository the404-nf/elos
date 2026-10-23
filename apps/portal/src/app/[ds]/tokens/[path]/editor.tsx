"use client";
// Edit a token and see it applied, in every theme at once, in the components that bind to it.
// Each theme's preview overrides one CSS variable; aliases are emitted as var() so dependents follow.
import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Catalog, CompositionNode } from "@elos/contracts";
import { cssVar } from "@elos/core/css";
import { Render } from "@/components/elos-client.tsx";
import { TokenPreview } from "@/components/token-preview.tsx";
import { saveToken } from "../actions.ts";

export type ThemeValue = { theme: string; raw: string; resolved: string };

export function TokenEditor({ ds, path, type, themes, dependents, previews, catalog }: {
  ds: string;
  path: string;
  type?: string;
  themes: ThemeValue[];
  dependents: string[];
  previews: { id: string; name: string; tree: CompositionNode }[];
  catalog: Catalog;
}) {
  const initial = Object.fromEntries(themes.map((t) => [t.theme, t.raw]));
  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(initial); // what the draft holds, updated on save so "dirty" stays truthful
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  // What the user typed, resolved against the catalog of that theme, so the override is a real CSS value.
  const resolve = (theme: string, input: string): string => {
    const m = input.trim().match(/^\{([^{}]+)\}$/);
    if (!m) return input.trim();
    const pool = theme === "light" ? catalog.tokens.base : (catalog.tokens[theme] ?? catalog.tokens.base);
    return pool.find((t) => t.path === m[1])?.value ?? "";
  };
  const tokenPaths = catalog.tokens.base.filter((t) => t.path !== path).map((t) => t.path);
  const dirty = themes.some((t) => (values[t.theme] ?? "").trim() !== baseline[t.theme]);
  const hasDialog = previews.some((p) => p.id === "ds.dialog");

  const save = () =>
    start(async () => {
      setError(null);
      const next = { ...baseline };
      for (const t of themes) {
        const v = (values[t.theme] ?? "").trim();
        if (v === baseline[t.theme]) continue;
        const r = await saveToken(ds, t.theme, path, v);
        if (!r.ok) return setError(r.error);
        next[t.theme] = v;
      }
      setBaseline(next);
      setValues(next);
      setSaved(true);
      router.refresh(); // pull the new draft into the server-rendered parts of the page
    });

  return (
    <div className="editor">
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {themes.map((t) => {
          const resolved = resolve(t.theme, values[t.theme] ?? "");
          return (
            <div key={t.theme}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <h2 style={{ margin: 0, textTransform: "capitalize" }}>{t.theme}</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  previewing <code>{resolved || "unresolved"}</code>
                </span>
              </div>
              <div
                className={`canvas${hasDialog ? " canvas--overlay" : ""}`}
                data-theme={t.theme}
                style={{ [cssVar(path)]: resolved || undefined } as CSSProperties}
              >
                {previews.length === 0 && <p className="muted">No component binds to this token yet.</p>}
                <div className="row" style={{ gap: 24, alignItems: "flex-start" }}>
                  {previews.map((p) => (
                    <figure key={p.name} style={{ margin: 0 }}>
                      <Render tree={p.tree} />
                      <figcaption className="muted" style={{ fontSize: 12, marginTop: 6 }}>{p.name}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {dependents.length > 0 && (
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Also changes: {dependents.map((d) => <code key={d} style={{ marginRight: 8 }}>{d}</code>)}
          </p>
        )}
      </section>

      <aside className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ margin: 0 }}>Value</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Type a value, or an alias like <code>{"{color.blue.500}"}</code>. Semantic tokens should alias, not hold raw values. The previews update as you type.
        </p>
        {themes.map((t) => {
          const v = values[t.theme] ?? "";
          const resolved = resolve(t.theme, v);
          const isHex = /^#[0-9a-f]{6}$/i.test(resolved);
          const set = (next: string) => {
            setSaved(false);
            setValues({ ...values, [t.theme]: next });
          };
          return (
            <div key={t.theme} className="field">
              <span style={{ textTransform: "capitalize" }}>{t.theme}</span>
              <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                <TokenPreview token={{ path, type, value: resolved }} size={32} />
                {type === "color" && (
                  <input type="color" value={isHex ? resolved.toLowerCase() : "#000000"} onChange={(e) => set(e.target.value)} aria-label={`${t.theme} color`}
                    style={{ width: 36, height: 32, padding: 0, border: 0, background: "none", cursor: "pointer" }} />
                )}
                <input list="token-paths" value={v} onChange={(e) => set(e.target.value)} style={{ flex: 1 }} aria-label={`${t.theme} value`} />
              </div>
              <span style={{ fontSize: 12 }}>→ {resolved || "unresolved"}</span>
            </div>
          );
        })}
        <datalist id="token-paths">
          {tokenPaths.map((p) => <option key={p} value={`{${p}}`} />)}
        </datalist>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <button type="button" className="ds-button__root" data-variant="primary" data-size="md" disabled={!dirty || pending} onClick={save}>
            <span className="ds-button__label">{pending ? "Saving…" : "Save to draft"}</span>
          </button>
          {dirty && !pending && (
            <button type="button" className="ds-button__root" data-variant="ghost" data-size="md" onClick={() => setValues(baseline)}>
              <span className="ds-button__label">Discard</span>
            </button>
          )}
          {saved && !dirty && <span className="muted" style={{ fontSize: 13 }}>Saved.</span>}
        </div>
      </aside>
    </div>
  );
}
