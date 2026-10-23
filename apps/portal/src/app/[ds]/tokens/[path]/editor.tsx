"use client";
// Edit a token and see it applied, in every theme at once, in the components and pages that bind to it.
// Each theme's preview overrides one CSS variable; aliases are emitted as var() so dependents follow.
import { useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Catalog, CompositionNode, PageExample, ResolvedToken } from "@elos/contracts";
import { cssVar } from "@elos/core/css";
import { Render } from "@/components/elos-client.tsx";
import { TokenPreview } from "@/components/token-preview.tsx";
import { TokenControl, type Stop } from "@/components/token-control.tsx";
import { saveToken } from "../actions.ts";

export type ThemeValue = { theme: string; raw: string; resolved: string };
type Chain = { path: string; value: string; direct?: boolean };

export function TokenEditor({ ds, token, themes, stops, fedBy, feeds, previews, pages, catalog }: {
  ds: string;
  token: ResolvedToken;
  themes: ThemeValue[];
  stops: Stop[];
  fedBy: Chain[];
  feeds: Chain[];
  previews: { id: string; name: string; tree: CompositionNode }[];
  pages: PageExample[];
  catalog: Catalog;
}) {
  const path = token.path;
  const initial = Object.fromEntries(themes.map((t) => [t.theme, t.raw]));
  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const resolve = (theme: string, input: string): string => {
    const m = input.trim().match(/^\{([^{}]+)\}$/);
    if (!m) return input.trim();
    const pool = theme === "light" ? catalog.tokens.base : (catalog.tokens[theme] ?? catalog.tokens.base);
    return pool.find((t) => t.path === m[1])?.value ?? "";
  };
  const tokenPaths = catalog.tokens.base.filter((t) => t.path !== path).map((t) => t.path);
  const dirty = themes.some((t) => (values[t.theme] ?? "").trim() !== baseline[t.theme]);
  const hasOverlay = previews.some((p) => p.id === "ds.dialog") || pages.some((p) => p.id === "page.confirm-delete");

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
      router.refresh();
    });

  const ChainList = ({ title, items, empty }: { title: string; items: Chain[]; empty: string }) => (
    <div className="field">
      <span>{title}</span>
      {items.length === 0 ? (
        <span className="muted" style={{ fontSize: 12 }}>{empty}</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.slice(0, 8).map((c) => (
            <Link key={c.path} href={`/${ds}/tokens/${c.path}`} className="row" style={{ gap: 8, textDecoration: "none", fontSize: 13, opacity: c.direct === false ? 0.7 : 1 }}>
              <TokenPreview token={{ path: c.path, type: token.type, value: c.value }} size={18} />
              <code>{c.path}</code>
            </Link>
          ))}
          {items.length > 8 && <span className="muted" style={{ fontSize: 12 }}>and {items.length - 8} more</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="editor">
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {themes.map((t) => {
          const resolved = resolve(t.theme, values[t.theme] ?? "");
          return (
            <div key={t.theme}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <h2 style={{ margin: 0, textTransform: "capitalize" }}>{t.theme}</h2>
                <span className="muted" style={{ fontSize: 13 }}>previewing <code>{resolved || "unresolved"}</code></span>
              </div>
              <div className={`canvas${hasOverlay ? " canvas--overlay" : ""}`} data-theme={t.theme} style={{ [cssVar(path)]: resolved || undefined } as CSSProperties}>
                {previews.length === 0 && pages.length === 0 && <p className="muted">No component binds to this token yet.</p>}
                {pages.length > 0 && (
                  <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", marginBottom: previews.length ? 24 : 0 }}>
                    {pages.map((pg) => (
                      <figure key={pg.id} style={{ margin: 0, minWidth: 0 }}>
                        <Render tree={pg.tree} />
                        <figcaption className="muted" style={{ fontSize: 12, marginTop: 6 }}>{pg.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
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
      </section>

      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ margin: 0 }}>Value</h2>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {stops.length > 1 ? "Pick a stop on the scale to bind to a token, or type a value or alias." : <>Type a value, or an alias like <code>{"{color.blue.500}"}</code>.</>} The previews update as you change it.
          </p>
          {themes.map((t) => {
            const raw = values[t.theme] ?? "";
            return (
              <div key={t.theme} className="field">
                <span style={{ textTransform: "capitalize" }}>{t.theme}</span>
                <TokenControl token={token} raw={raw} resolved={resolve(t.theme, raw)} theme={t.theme} stops={stops} tokenPaths={tokenPaths}
                  onChange={(next) => { setSaved(false); setValues({ ...values, [t.theme]: next }); }} />
              </div>
            );
          })}
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
        </div>

        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Chain</h2>
          <ChainList title="Built from" items={fedBy} empty="A primitive: holds a raw value." />
          <ChainList title="Feeds" items={feeds} empty="Nothing aliases this token." />
        </div>
      </aside>
    </div>
  );
}
