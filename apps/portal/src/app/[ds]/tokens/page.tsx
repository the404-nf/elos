import type { ReactNode } from "react";
import type { ResolvedToken } from "@elos/contracts";
import { getDraft } from "@/lib/store.ts";
import { TokenPreview } from "@/components/token-preview.tsx";
import { Card, Input, Link, Nav, NavItem, Stack, Table, TableCell, TableRow, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

type Tier = "primitive" | "semantic" | "component";
const TIERS: Tier[] = ["primitive", "semantic", "component"];
const COMPONENT_GROUPS = new Set(["switch", "dialog", "avatar", "progress", "overlay", "illustration", "control", "size"]);
const tierOf = (t: ResolvedToken): Tier => (t.alias ? "semantic" : COMPONENT_GROUPS.has(t.path.split(".")[0]!) ? "component" : t.path.split(".").length <= 3 && !t.path.startsWith("type.") ? "primitive" : "semantic");

/** Where a token sits in the sidebar: color by role, the rest by what it is. Order is display order. */
const GROUP_OF: Record<string, string> = { space: "Space", radius: "Radius", font: "Typography", type: "Typography", motion: "Motion", shadow: "Elevation", gradient: "Gradients", icon: "Icons", opacity: "Other", border: "Other", focus: "Other" };
const groupOf = (t: ResolvedToken): string => {
  const [head, role] = t.path.split(".");
  if (head === "color") return tierOf(t) === "primitive" ? "Color · palette" : `Color · ${role}`;
  return GROUP_OF[head!] ?? (COMPONENT_GROUPS.has(head!) ? "Component sizes" : head!);
};
const ORDER = ["Color · palette", "Color · text", "Color · surface", "Color · border", "Color · accent", "Color · status", "Color · action", "Color · nav", "Color · card", "Color · bloom", "Color · overlay", "Color · icon", "Color · illustration", "Color · gradient", "Space", "Radius", "Typography", "Motion", "Elevation", "Gradients", "Icons", "Other", "Component sizes"];
const short = (v: string) => (v.length > 48 ? `${v.slice(0, 48)}…` : v);
const mono = { fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-sm)", textDecoration: "none" } as const;

export default async function Tokens({ params, searchParams }: { params: Promise<{ ds: string }>; searchParams: Promise<{ group?: string; tier?: string; q?: string }> }) {
  const [{ ds }, query] = await Promise.all([params, searchParams]);
  const { catalog } = await getDraft(ds);
  const dark = new Map((catalog.tokens.dark ?? []).map((t) => [t.path, t]));
  const all = catalog.tokens.base;

  const groups = new Map<string, ResolvedToken[]>();
  for (const t of all) groups.set(groupOf(t), [...(groups.get(groupOf(t)) ?? []), t]);
  const ordered = [...groups.keys()].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  const group = query.group && groups.has(query.group) ? query.group : null;
  const tier = (TIERS as string[]).includes(query.tier ?? "") ? (query.tier as Tier) : null;
  const q = (query.q ?? "").trim().toLowerCase();
  const matches = (t: ResolvedToken) => (!tier || tierOf(t) === tier) && (!q || t.path.includes(q) || t.value.toLowerCase().includes(q) || (t.alias ?? "").includes(q));
  const href = (g: string | null, tr: string | null) => `/${ds}/tokens?${new URLSearchParams({ ...(g ? { group: g } : {}), ...(tr ? { tier: tr } : {}), ...(q ? { q } : {}) })}`;
  const shown = (group ? [group] : ordered).map((g) => [g, groups.get(g)!.filter(matches)] as const).filter(([, list]) => list.length);

  /** One swatch, or two when the dark theme changes the value. */
  const Swatch = ({ t }: { t: ResolvedToken }) => {
    const d = dark.get(t.path);
    const differs = d && (d.alias !== t.alias || d.value !== t.value);
    return (
      <span className="swatch-pair">
        <TokenPreview token={t} size={32} />
        {differs && d && <span data-theme="dark"><TokenPreview token={d} size={32} /></span>}
      </span>
    );
  };
  const Row = ({ t }: { t: ResolvedToken }) => {
    const d = dark.get(t.path);
    const darkValue = d && (d.alias !== t.alias || d.value !== t.value) ? (d.alias ? `→ ${d.alias}` : short(d.value)) : null;
    return (
      <TableRow>
        <TableCell><Swatch t={t} /></TableCell>
        <TableCell><Link href={`/${ds}/tokens/${t.path}`} label={t.path} tone="inherit" style={mono} title={t.description} /></TableCell>
        <TableCell><Text as="code" variant="code" tone="secondary" text={t.alias ? `→ ${t.alias}${darkValue ? `  ·  dark ${darkValue}` : ""}` : darkValue ? `dark ${darkValue}` : ""} /></TableCell>
        <TableCell align="end"><Text as="code" variant="code" text={short(t.value)} /></TableCell>
      </TableRow>
    );
  };
  const section = (g: string, list: ResolvedToken[]): ReactNode =>
    g === "Color · palette" ? (
      <div className="swatches">
        {list.map((t) => (
          <div key={t.path} className="swatch">
            <span className={`swatch-chip${t.value.length === 9 ? " swatch-chip--alpha" : ""}`} style={{ background: t.value }} title={t.description} />
            <Link href={`/${ds}/tokens/${t.path}`} label={t.path.replace("color.", "")} tone="inherit" style={{ ...mono, fontSize: "var(--font-size-xs)" }} />
            <Text as="span" variant="caption" tone="tertiary" text={t.value} />
          </div>
        ))}
      </div>
    ) : (
      <div className="scroll-x token-table"><Table caption={`${g} tokens`} body={list.map((t) => <Row key={t.path} t={t} />)} /></div>
    );

  return (
    <>
      <PageHead
        eyebrow={catalog.system.name}
        title="Tokens"
        description={`${all.length} tokens in three tiers. Components bind to semantic tokens, never to primitives.`}
        extras={TIERS.map((tr) => <Text key={tr} as="span" variant="caption" text={`${all.filter((t) => tierOf(t) === tr).length} ${tr}`} style={{ opacity: 0.85 }} />)}
      />
      <div className="with-side">
        <aside>
          <Card padding="lg">
            <Stack gap="sm">
              <Text as="span" variant="caption" tone="secondary" text="Groups" />
              <Nav label="Token groups" list={[
                <NavItem key="all" href={href(null, tier)} label="All" meta={String(all.length)} current={!group} />,
                ...ordered.map((g) => <NavItem key={g} href={href(g, tier)} label={g} meta={String(groups.get(g)!.length)} current={g === group} />),
              ]} />
            </Stack>
          </Card>
        </aside>
        <Stack gap="md">
          <div className="toolbar">
            <Nav label="Tier" orientation="horizontal" list={[
              <NavItem key="all" href={href(group, null)} label="All" tone="chip" current={!tier} />,
              ...TIERS.map((tr) => <NavItem key={tr} href={href(group, tr)} label={tr.charAt(0).toUpperCase() + tr.slice(1)} tone="chip" current={tier === tr} />),
            ]} />
            <form method="get" action={`/${ds}/tokens`}>
              {group && <input type="hidden" name="group" value={group} />}
              {tier && <input type="hidden" name="tier" value={tier} />}
              <Input type="search" name="q" defaultValue={q} placeholder="Filter by name, value or alias" aria-label="Filter tokens" />
            </form>
          </div>
          {shown.length === 0 && <Card><Text tone="secondary" text={`No token matches "${q}".`} /></Card>}
          <Card padding="lg">
            <Stack gap="md">
              {shown.map(([g, list]) => (
                <Stack key={g} gap="sm">
                  <div className="table-head">
                    <Text as="h2" variant="label" text={g} />
                    <Text as="span" variant="code" tone="secondary" text={String(list.length)} />
                  </div>
                  {section(g, list)}
                </Stack>
              ))}
            </Stack>
          </Card>
        </Stack>
      </div>
    </>
  );
}
