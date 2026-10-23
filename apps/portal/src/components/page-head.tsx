// The header every screen starts with: where you are, what it is, and the screen's actions.
import type { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, Stack, Text } from "./elos-client.tsx";

export function PageHead({ title, code, description, crumbs, actions, children }: {
  title: string;
  code?: boolean; // the title is an identifier (a token path), set in the mono face
  description?: string;
  crumbs?: { href: string; label: string }[];
  actions?: ReactNode;
  children?: ReactNode; // beside the title: badges, ids
}) {
  return (
    <header className="page-head">
      {crumbs && crumbs.length > 0 && (
        <Breadcrumb label="You are here" list={crumbs.map((c, i) => <BreadcrumbItem key={c.href} href={c.href} label={c.label} current={i === crumbs.length - 1} separator={i === crumbs.length - 1 ? "" : undefined} />)} />
      )}
      <div className="page-head-row">
        <Stack gap="xs">
          <Stack direction="row" gap="sm" align="center">
            <Text as="h1" variant="title" text={title} style={code ? { fontFamily: "var(--font-family-mono)" } : undefined} />
            {children}
          </Stack>
          {description && <Text tone="secondary" text={description} />}
        </Stack>
        {actions && <Stack direction="row" gap="sm" align="center">{actions}</Stack>}
      </div>
    </header>
  );
}
