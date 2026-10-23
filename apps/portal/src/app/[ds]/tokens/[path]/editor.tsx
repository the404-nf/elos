"use client";
// Edit a token and see it applied, in every theme at once, in the components and pages that bind to it.
// Each theme's preview overrides one CSS variable; aliases are emitted as var() so dependents follow.
import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Catalog, CompositionNode, PageExample, ResolvedToken } from "@elos/contracts";
import { cssVar } from "@elos/core/css";
import { Button, Card, Link, Render, Stack, Text } from "@/components/elos-client.tsx";
import { TokenPreview } from "@/components/token-preview.tsx";
import { TokenControl, type Stop } from "@/components/token-control.tsx";
import { saveToken } from "../actions.ts";

export type ThemeValue = { theme: string; raw: string; resolved: string };
type Chain = { path: string; value: string; direct?: boolean };
const mono: CSSProperties = { fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-sm)" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
    <Stack gap="xs">
      <Text as="span" variant="caption" text={title} style={{ fontWeight: "var(--font-weight-medium)" }} />
      {items.length === 0 ? (
        <Text as="span" variant="caption" tone="secondary" text={empty} />
      ) : (
        <Stack gap="xs" align="start">
          {items.slice(0, 8).map((c) => (
            <Stack key={c.path} direction="row" gap="sm" align="center" style={{ opacity: c.direct === false ? 0.7 : 1 }}>
              <TokenPreview token={{ path: c.path, type: token.type, value: c.value }} size={18} />
              <Link href={`/${ds}/tokens/${c.path}`} label={c.path} tone="inherit" style={mono} />
            </Stack>
          ))}
          {items.length > 8 && <Text as="span" variant="caption" tone="secondary" text={`and ${items.length - 8} more`} />}
        </Stack>
      )}
    </Stack>
  );

  return (
    <div className="editor editor--controls-first">
      <aside>
        <datalist id="token-paths">{tokenPaths.map((p) => <option key={p} value={`{${p}}`} />)}</datalist>
        <Card heading="h2" title="Value">
          <Stack gap="md">
            <Text variant="caption" tone="secondary" text={stops.length > 1 ? "Pick a stop on the scale to bind to a token, or type a value or alias. The previews follow as you change it." : "Type a value, or an alias like {color.blue.500}. The previews follow as you change it."} />
            {themes.map((t) => {
              const raw = values[t.theme] ?? "";
              return (
                <Stack key={t.theme} gap="xs">
                  <Text as="span" variant="caption" text={cap(t.theme)} style={{ fontWeight: "var(--font-weight-medium)" }} />
                  <TokenControl token={token} raw={raw} resolved={resolve(t.theme, raw)} theme={t.theme} stops={stops}
                    onChange={(next) => { setSaved(false); setValues({ ...values, [t.theme]: next }); }} />
                </Stack>
              );
            })}
            {error && <div className="error">{error}</div>}
            <Stack direction="row" gap="sm" align="center">
              <Button label={pending ? "Saving…" : "Save to draft"} disabled={!dirty || pending} onClick={save} />
              {dirty && !pending && <Button label="Discard" variant="ghost" onClick={() => setValues(baseline)} />}
              {saved && !dirty && <Text as="span" variant="caption" tone="secondary" text="Saved." />}
            </Stack>
          </Stack>
        </Card>

        <Card heading="h2" title="Chain">
          <Stack gap="md">
            <ChainList title="Built from" items={fedBy} empty="A primitive: holds a raw value." />
            <ChainList title="Feeds" items={feeds} empty="Nothing aliases this token." />
          </Stack>
        </Card>
      </aside>

      <Stack gap="lg">
        {themes.map((t) => {
          const resolved = resolve(t.theme, values[t.theme] ?? "");
          return (
            <Stack key={t.theme} gap="sm">
              <Stack direction="row" gap="sm" align="center" style={{ justifyContent: "space-between" }}>
                <Text as="h2" variant="heading" text={cap(t.theme)} />
                <Text as="span" variant="caption" tone="secondary" text={`previewing ${resolved || "unresolved"}`} style={mono} />
              </Stack>
              <div className={`canvas${hasOverlay ? " canvas--overlay" : ""}`} data-theme={t.theme} style={{ [cssVar(path)]: resolved || undefined } as CSSProperties}>
                {previews.length === 0 && pages.length === 0 && <Text tone="secondary" text="No component binds to this token yet." />}
                {pages.length > 0 && (
                  <div style={{ display: "grid", gap: "var(--space-stack-lg)", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", marginBottom: previews.length ? "var(--space-stack-lg)" : 0 }}>
                    {pages.map((pg) => (
                      <figure key={pg.id} style={{ margin: 0, minWidth: 0 }}>
                        <Render tree={pg.tree} />
                        <figcaption className="caption" style={{ marginTop: "var(--space-stack-xs)" }}>{pg.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
                <div className="row" style={{ gap: "var(--space-stack-lg)", alignItems: "flex-start" }}>
                  {previews.map((p) => (
                    <figure key={p.name} style={{ margin: 0, maxWidth: "100%" }}>
                      <Render tree={p.tree} />
                      <figcaption className="caption" style={{ marginTop: "var(--space-stack-xs)" }}>{p.name}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </Stack>
          );
        })}
      </Stack>
    </div>
  );
}
