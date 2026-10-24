// The Bloom header every screen starts with: the app nav on top, then where you are, what the page is, and its actions.
// A thin composition over the ds.page-head contract; the nav row is the portal's and comes from the current path.
import type { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, PageHeadBase } from "./elos-client.tsx";
import { TopNav } from "@/app/[ds]/nav.tsx";

export function PageHead({ title, code, description, eyebrow, variant, crumbs, actions, extras, tabs, children }: {
  title: string;
  code?: boolean; // the title is an identifier (a token path): the eyebrow names its group
  description?: string; // the lead: one sentence
  eyebrow?: string;
  variant?: "page-title" | "display";
  crumbs?: { href: string; label: string }[];
  actions?: ReactNode;
  extras?: ReactNode;
  tabs?: ReactNode;
  children?: ReactNode; // beside the title: badges, ids (rendered as extras)
}) {
  const eye = eyebrow ?? (code ? title.split(".").slice(0, -1).join(" · ") : undefined);
  return (
    <PageHeadBase
      title={title}
      eyebrow={eye}
      lead={description}
      variant={variant}
      nav={<TopNav />}
      breadcrumb={crumbs && crumbs.length > 0 ? <Breadcrumb label="You are here" list={crumbs.map((c, i) => <BreadcrumbItem key={c.href} href={c.href} label={c.label} current={i === crumbs.length - 1} separator={i === crumbs.length - 1 ? "" : undefined} />)} /> : undefined}
      actions={actions}
      extras={extras ?? children}
      tabs={tabs}
    />
  );
}
