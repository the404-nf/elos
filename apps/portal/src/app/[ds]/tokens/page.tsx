import type { CSSProperties } from "react";
import type { ResolvedToken } from "@elos/contracts";
import { tokenUsage } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { TokenPreview } from "@/components/token-preview.tsx";
import { Card, Link, Nav, NavItem, Stack, Table, TableCell, TableRow, Text } from "@/components/elos-client.tsx";
import { PageHead } from "@/components/page-head.tsx";

const TIER = (t: ResolvedToken) => (t.alias ? "semantic" : t.path.split(".").length <= 3 ? "primitive" : "component");
const GROUP_NOTE: Record<string, string> = {
  color: "Surfaces, text, borders, actions and status. Semantic names carry meaning; primitives are the palette.",
  space: "Spacing scale and the inset and stack roles components bind to.",
  radius: "Corner radii: pills for controls, 16 for containers, 12 for fields and insets, 22 for the Bloom header.",
  font: "Families, the size ramp and weights.",
  type: "The eleven type styles: family, size, weight, line height and tracking.",
  motion: "Durations and easings the parts of a component transition and animate with.",
  gradient: "Recipes over color tokens: the Bloom, the beam, bars, fades and the shimmer.",
  shadow: "Overlay elevation and the hover glows. Nothing at rest casts a shadow.",
};
const mono: CSSProperties = { fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-sm)" };
const darkCell: CSSProperties = { background: "var(--color-surface-canvas)" };
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A background/foreground pair drawn as one swatch with text on it. */
function Pair({ bg, fg }: { bg: ResolvedToken; fg: ResolvedToken }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 36, borderRadius: "var(--radius-control)", background: bg.value, color: fg.value, border: "var(--border-width) solid var(--color-border-subtle)", fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-sm)" }} title={`${bg.path} / ${fg.path}`}>
      Aa
    </span>
  );
}

export default async function Tokens({ params, searchParams }: { params: Promise<{ ds: string }>; searchParams: Promise<{ group?: string }> }) {
  const [{ ds }, query] = await Promise.all([params, searchParams]);
  const { catalog } = await getDraft(ds);
  const usage = tokenUsage(catalog);
  const dark = new Map((catalog.tokens.dark ?? []).map((t) => [t.path, t]));
  const usedBy = (t: ResolvedToken) => [...new Set((usage.get(t.path) ?? []).map((u) => u.split(" ")[0]!.replace("ds.", "")))].join(", ");

  const groups = new Map<string, ResolvedToken[]>();
  for (const t of catalog.tokens.base) groups.set(t.path.split(".")[0]!, [...(groups.get(t.path.split(".")[0]!) ?? []), t]);
  const group = query.group && groups.has(query.group) ? query.group : "color";
  const tokens = groups.get(group)!;
  const tiers = ["primitive", "semantic", "component"].map((tier) => [tier, tokens.filter((t) => TIER(t) === tier).length] as const).filter(([, n]) => n);

  const head = (
    <TableRow>
      <TableCell as="th">Light</TableCell>
      <TableCell as="th">Dark</TableCell>
      <TableCell as="th">Token</TableCell>
      <TableCell as="th">Value</TableCell>
      <TableCell as="th">Used by</TableCell>
    </TableRow>
  );

  const Row = ({ t }: { t: ResolvedToken }) => {
    const d = dark.get(t.path);
    const darkDiffers = d && (d.alias !== t.alias || d.value !== t.value);
    return (
      <TableRow>
        <TableCell><TokenPreview token={t} /></TableCell>
        <TableCell data-theme="dark" style={darkCell}>
          {darkDiffers && d ? <TokenPreview token={d} /> : <Text as="span" variant="caption" tone="secondary" text="same" />}
        </TableCell>
        <TableCell>
          <Stack gap="xs" align="start">
            <Link href={`/${ds}/tokens/${t.path}`} label={t.path} tone="inherit" style={mono} />
            {t.description && <Text as="span" variant="caption" tone="secondary" text={t.description} />}
            <Text as="span" variant="caption" tone="tertiary" text={TIER(t)} />
          </Stack>
        </TableCell>
        <TableCell>
          <Stack gap="xs" align="start">
            <span style={mono}>{t.alias ? `{${t.alias}}` : t.value.length > 60 ? `${t.value.slice(0, 60)}…` : t.value}{t.alias && <span className="muted"> → {t.value}</span>}</span>
            {darkDiffers && d && <span className="caption" style={mono}>dark: {d.alias ? `{${d.alias}}` : d.value.length > 60 ? `${d.value.slice(0, 60)}…` : d.value}</span>}
          </Stack>
        </TableCell>
        <TableCell><Text as="span" variant="caption" tone="secondary" text={usedBy(t)} /></TableCell>
      </TableRow>
    );
  };

  const PairRow = ({ name, bg, fg }: { name: string; bg: ResolvedToken; fg: ResolvedToken }) => {
    const dbg = dark.get(bg.path) ?? bg, dfg = dark.get(fg.path) ?? fg;
    return (
      <TableRow>
        <TableCell><Pair bg={bg} fg={fg} /></TableCell>
        <TableCell data-theme="dark" style={darkCell}><Pair bg={dbg} fg={dfg} /></TableCell>
        <TableCell>
          <Stack gap="xs" align="start">
            <Text as="span" variant="label" text={name} />
            <Stack direction="row" gap="sm">
              <Link href={`/${ds}/tokens/${bg.path}`} label={bg.path.split(".").pop()!} tone="inherit" style={mono} />
              <Link href={`/${ds}/tokens/${fg.path}`} label={fg.path.split(".").pop()!} tone="inherit" style={mono} />
            </Stack>
            <Text as="span" variant="caption" tone="tertiary" text="semantic pair" />
          </Stack>
        </TableCell>
        <TableCell><span style={mono}>{fg.value} on {bg.value}</span></TableCell>
        <TableCell><Text as="span" variant="caption" tone="secondary" text={usedBy(bg)} /></TableCell>
      </TableRow>
    );
  };

  // Color: primitives by hue; semantic by role; action/status tones as pairs.
  const sections: { name: string; rows: React.ReactNode[] }[] = [];
  if (group === "color") {
    const roles = new Map<string, ResolvedToken[]>();
    for (const t of tokens) {
      const role = t.alias || t.path.split(".").length > 3 ? t.path.split(".")[1]! : "palette";
      roles.set(role, [...(roles.get(role) ?? []), t]);
    }
    for (const [role, list] of roles) {
      const byPath = new Map(list.map((t) => [t.path, t]));
      const pairs = list.filter((t) => t.path.endsWith(".background") && byPath.has(t.path.replace(/\.background$/, ".foreground")));
      const paired = new Set(pairs.flatMap((t) => [t.path, t.path.replace(/\.background$/, ".foreground")]));
      sections.push({ name: `Color · ${role}`, rows: [
        ...pairs.map((bg) => <PairRow key={bg.path} name={bg.path.split(".").slice(2, -1).join(".")} bg={bg} fg={byPath.get(bg.path.replace(/\.background$/, ".foreground"))!} />),
        ...list.filter((t) => !paired.has(t.path)).map((t) => <Row key={t.path} t={t} />),
      ] });
    }
  } else sections.push({ name: title(group), rows: tokens.map((t) => <Row key={t.path} t={t} />) });

  return (
    <>
      <PageHead
        eyebrow={catalog.system.name}
        title="Tokens"
        description={`${catalog.tokens.base.length} tokens in three tiers. Components bind to semantic tokens, never to primitives.`}
        extras={tiers.map(([tier, count]) => <Text key={tier} as="span" variant="caption" text={`${count} ${tier}`} style={{ opacity: 0.85 }} />)}
      />
      <div className="with-side">
        <aside>
          <Card padding="lg">
            <Nav label="Token groups" list={[...groups].map(([g, list]) => <NavItem key={g} href={`/${ds}/tokens?group=${g}`} label={`${title(g)} ${list.length}`} current={g === group} />)} />
          </Card>
        </aside>
        <Card heading="h2" title={title(group)}>
          <Stack gap="lg">
            {GROUP_NOTE[group] && <Text variant="caption" tone="secondary" text={GROUP_NOTE[group]} />}
            {sections.map((s) => (
              <Stack key={s.name} gap="sm">
                {sections.length > 1 && <Text as="h3" variant="heading" text={s.name} />}
                <div className="scroll-x"><Table caption={`${s.name} tokens`} head={head} body={s.rows} /></div>
              </Stack>
            ))}
          </Stack>
        </Card>
      </div>
    </>
  );
}
