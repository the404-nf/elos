import Link from "next/link";
import { notFound } from "next/navigation";
import type { CompositionNode } from "@elos/contracts";
import { tokenUsage, treeComponents } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { scaleFor } from "@/lib/scale.ts";
import { TokenEditor, type ThemeValue } from "./editor.tsx";

export default async function TokenPage({ params }: { params: Promise<{ ds: string; path: string }> }) {
  const { ds, path } = await params;
  const { catalog } = await getDraft(ds);
  const base = catalog.tokens.base.find((t) => t.path === path);
  if (!base) notFound();
  const byPath = new Map(catalog.tokens.base.map((t) => [t.path, t]));

  // Chain upward: what this token is built from.
  const fedBy: { path: string; value: string }[] = [];
  for (let t = base.alias ? byPath.get(base.alias) : undefined; t; t = t.alias ? byPath.get(t.alias) : undefined) fedBy.push({ path: t.path, value: t.value });
  // Chain downward: every token that resolves through this one.
  const dependents = new Set<string>();
  let frontier = [path];
  while (frontier.length) {
    const next = catalog.tokens.base.filter((t) => t.alias && frontier.includes(t.alias) && !dependents.has(t.path)).map((t) => t.path);
    next.forEach((p) => dependents.add(p));
    frontier = next;
  }
  const feeds = [...dependents].map((p) => ({ path: p, value: byPath.get(p)!.value, direct: byPath.get(p)!.alias === path }));

  const usage = tokenUsage(catalog);
  const componentIds = new Set([path, ...dependents].flatMap((p) => (usage.get(p) ?? []).map((u) => u.split(" ")[0]!)));
  const previews: { id: string; name: string; tree: CompositionNode }[] = catalog.contracts
    .filter((c) => componentIds.has(c.id))
    .flatMap((c) => c.examples.slice(0, 2).map((e) => ({ id: c.id, name: `${c.name} · ${e.name}`, tree: c.id === "ds.dialog" ? { ...e.tree, props: { ...e.tree.props, open: true } } : e.tree })))
    .slice(0, 6);
  const pages = catalog.pages.filter((pg) => [...treeComponents(pg.tree)].some((id) => componentIds.has(id)));

  const themes: ThemeValue[] = ["light", ...catalog.system.themes.map((t) => t.name)].map((theme) => {
    const t = (theme === "light" ? catalog.tokens.base : catalog.tokens[theme]!).find((x) => x.path === path)!;
    return { theme, raw: t.alias ? `{${t.alias}}` : t.value, resolved: t.value };
  });

  return (
    <>
      <p className="muted" style={{ fontSize: 13 }}>
        <Link href={`/${ds}/tokens`}>Tokens</Link> / {path.split(".").slice(0, -1).join(".")}
      </p>
      <h1><code>{path}</code></h1>
      {base.description && <p className="muted">{base.description}</p>}
      <TokenEditor ds={ds} token={base} themes={themes} stops={scaleFor(catalog, base)} fedBy={fedBy} feeds={feeds} previews={previews} pages={pages} catalog={catalog} />
    </>
  );
}
