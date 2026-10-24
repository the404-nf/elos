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
const NOTE: Record<string, string> = {
  "Color · palette": "Primitives: the ramps. Bind through a semantic token, never directly.",
  "Color · text": "Ink or white. Pink text only in links, the accent badge and display gradient words.",
  "Color · surface": "Fill steps: canvas, raised, overlay, sunken. Cards are a fill step, not a shadow.",
  "Color · action": "Primary is ink in light and near-white in dark. The brand pink is not a button.",
  Radius: "Pills for controls, 16 for containers, 12 for fields and insets, 22 for the Bloom header.",
  Typography: "Three families, the size ramp, five weights, and the eleven type styles.",
  Motion: "Durations and easings the parts of a component transition and animate with.",
  Gradients: "Recipes over color tokens. Stops follow the theme of the element they paint.",
  Elevation: "Overlay elevation and the hover glows. Nothing at rest casts a shadow.",
};
const short = (v: string) => (v.length > 56 ? `${v.slice(0, 56)}…` : v);

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
  const count = shown.reduce((n, [, list]) => n + list.length, 0);

  const head = (
    <TableRow>
      <TableCell as="th">Light</TableCell>
      <TableCell as="th">Dark</TableCell>
      <TableCell as="th">Token</TableCell>
      <TableCell as="th">Tier</TableCell>
      <TableCell as="th" align="end">Value</TableCell>
    </TableRow>
  );
  const Row = ({ t }: { t: ResolvedToken }) => {
    const d = dark.get(t.path);
    const darkDiffers = d && (d.alias !== t.alias || d.value !== t.value);
    return (
      <TableRow>
        <TableCell><TokenPreview token={t} /></TableCell>
        <TableCell data-theme="dark" style={{ background: "var(--color-surface-canvas)" }}>{darkDiffers && d ? <TokenPreview token={d} /> : <Text as="span" variant="caption" tone="tertiary" text="same" />}</TableCell>
        <TableCell>
          <Stack gap="xs" align="start">
            <Link href={`/${ds}/tokens/${t.path}`} label={t.path} tone="inherit" style={{ fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-sm)", textDecoration: "none" }} />
            {t.description && <Text as="span" variant="caption" tone="secondary" text={t.description} />}
          </Stack>
        </TableCell>
        <TableCell><Text as="span" variant="caption" tone="secondary" text={tierOf(t)} /></TableCell>
        <TableCell align="end">
          <Stack gap="xs" align="end">
            <Text as="code" variant="code" text={t.alias ? `→ ${t.alias}` : short(t.value)} />
            {t.alias && <Text as="code" variant="code" tone="tertiary" text={short(t.value)} />}
            {darkDiffers && d && <Text as="code" variant="code" tone="tertiary" text={`dark: ${d.alias ? `→ ${d.alias}` : short(d.value)}`} />}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  const section = (g: string, list: ResolvedToken[]): ReactNode =>
    g === "Color · palette" ? (
      <div className="swatches">
        {list.map((t) => (
          <div key={t.path} className="swatch">
            <span className={`swatch-chip${t.value.length === 9 ? " swatch-chip--alpha" : ""}`} style={{ background: t.value }} title={t.description} />
            <Link href={`/${ds}/tokens/${t.path}`} label={t.path.replace("color.", "")} tone="inherit" style={{ fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-xs)", textDecoration: "none" }} />
            <Text as="span" variant="caption" tone="tertiary" text={t.value} />
          </div>
        ))}
      </div>
    ) : (
      <div className="scroll-x token-table"><Table caption={`${g} tokens`} head={head} body={list.map((t) => <Row key={t.path} t={t} />)} /></div>
    );

  return (
    <>
      <PageHead
        eyebrow={catalog.system.name}
        title="Tokens"
        description={`${all.length} tokens in three tiers. Components bind to semantic tokens, never to primitives.`}
        extras={TIERS.map((tr) => <Text key={tr} as="span" variant="caption" text={`${all.filter((t) => tierOf(t) === tr).length} ${tr}`} style={{ opacity: 0.85 }} />)}
      />
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
      <div className="with-side">
        <aside>
          <Card padding="lg">
            <Stack gap="sm">
              <Text as="span" variant="caption" tone="secondary" text="Groups" />
              <Nav label="Token groups" list={[
                <NavItem key="all" href={href(null, tier)} label={`All ${all.length}`} current={!group} />,
                ...ordered.map((g) => <NavItem key={g} href={href(g, tier)} label={`${g} ${groups.get(g)!.length}`} current={g === group} />),
              ]} />
            </Stack>
          </Card>
        </aside>
        <Stack gap="md">
          {shown.length === 0 && <Card><Text tone="secondary" text={`No token matches "${q}".`} /></Card>}
          {shown.map(([g, list]) => (
            <Card key={g} heading="h2" title={`${g} · ${list.length}`}>
              <Stack gap="md">
                {NOTE[g] && <Text variant="caption" tone="secondary" text={NOTE[g]} />}
                {section(g, list)}
              </Stack>
            </Card>
          ))}
          {shown.length > 1 && <Text variant="caption" tone="tertiary" text={`${count} tokens shown`} />}
        </Stack>
      </div>
    </>
  );
}
