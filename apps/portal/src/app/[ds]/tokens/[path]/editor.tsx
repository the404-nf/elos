"use client";
// Edit a token and see it applied in the components that bind to it, before saving.
// The live preview overrides one CSS variable; aliases are emitted as var() so dependents follow.
import { useMemo, useState, useTransition } from "react";
import type { Catalog, CompositionNode } from "@elos/contracts";
import { cssVar } from "@elos/core/css";
import { Render } from "@/components/elos-client.tsx";
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
  const [values, setValues] = useState(Object.fromEntries(themes.map((t) => [t.theme, t.raw])));
  const [previewTheme, setPreviewTheme] = useState(themes[0]!.theme);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  // Resolve what the user typed against the catalog so the override is a real CSS value.
  const resolve = (theme: string, input: string): string => {
    const m = input.trim().match(/^\{([^{}]+)\}$/);
    if (!m) return input.trim();
    const pool = theme === "light" ? catalog.tokens.base : (catalog.tokens[theme] ?? catalog.tokens.base);
    return pool.find((t) => t.path === m[1])?.value ?? "";
  };
  const overrideValue = useMemo(() => resolve(previewTheme, values[previewTheme] ?? ""), [values, previewTheme, catalog]);
  const tokenPaths = useMemo(() => catalog.tokens.base.map((t) => t.path), [catalog]);
  const dirty = themes.some((t) => values[t.theme] !== t.raw);

  const save = () =>
    start(async () => {
      setError(null);
      for (const t of themes) {
        if (values[t.theme] === t.raw) continue;
        const r = await saveToken(ds, t.theme, path, values[t.theme]!);
        if (!r.ok) return setError(r.error);
      }
      setSaved(true);
    });

  return (
    <div className="editor">
      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>In context</h2>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            Preview theme
            <select value={previewTheme} onChange={(e) => setPreviewTheme(e.target.value)}>
              {themes.map((t) => (
                <option key={t.theme}>{t.theme}</option>
              ))}
            </select>
          </label>
        </div>
        <div className={`canvas${previews.some((p) => p.id === "ds.dialog") ? " canvas--overlay" : ""}`} data-theme={previewTheme} style={{ [cssVar(path)]: overrideValue || undefined } as React.CSSProperties}>
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
        {dependents.length > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            Also changes: {dependents.map((d) => <code key={d} style={{ marginRight: 8 }}>{d}</code>)}
          </p>
        )}
      </section>

      <aside className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Value</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Type a value or an alias like <code>{"{color.blue.500}"}</code>. Semantic tokens should alias, not hold raw values.
        </p>
        {themes.map((t) => {
          const v = values[t.theme] ?? "";
          const resolved = resolve(t.theme, v);
          const isHex = /^#[0-9a-f]{6}$/i.test(resolved);
          return (
            <label key={t.theme} className="field">
              {t.theme}
              <div className="row" style={{ gap: 8 }}>
                {type === "color" && (
                  <input type="color" value={isHex ? resolved : "#000000"} onChange={(e) => setValues({ ...values, [t.theme]: e.target.value })} style={{ width: 36, height: 32, padding: 0, border: 0, background: "none" }} aria-label={`${t.theme} color`} />
                )}
                <input list="token-paths" value={v} onChange={(e) => setValues({ ...values, [t.theme]: e.target.value })} style={{ flex: 1 }} />
              </div>
              <span style={{ fontSize: 12 }}>→ {resolved || "unresolved"}</span>
            </label>
          );
        })}
        <datalist id="token-paths">
          {tokenPaths.map((p) => (
            <option key={p} value={`{${p}}`} />
          ))}
        </datalist>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <button type="button" className="ds-button__root" data-variant="primary" data-size="md" disabled={!dirty || pending} onClick={save}>
            <span className="ds-button__label">{pending ? "Saving…" : "Save to draft"}</span>
          </button>
          {saved && !dirty && <span className="muted" style={{ fontSize: 13 }}>Saved.</span>}
        </div>
      </aside>
    </div>
  );
}
