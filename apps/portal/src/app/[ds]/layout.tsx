import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { emitCss } from "@elos/core/css";
import { emitComponentsCss } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { Badge, Elos, Link, Stack, Text, ThemeToggle } from "@/components/elos-client.tsx";
import { SideNav } from "./nav.tsx";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds).catch(() => ({ catalog: undefined }));
  return { title: catalog ? `${catalog.system.name} · Elos` : "Elos" };
}

export default async function SystemLayout({ params, children }: { params: Promise<{ ds: string }>; children: ReactNode }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds).catch(() => notFound());
  // ponytail: the viewed system's tokens style the whole portal, which is the point while Elos shows only Resonant;
  // scope the variables to the preview area once a second system is stored.
  const css = emitCss(catalog) + "\n" + emitComponentsCss(catalog);
  return (
    <Elos catalog={catalog}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="shell">
        <aside className="side">
          <Stack gap="xs" align="start">
            <Link href="/" label="Elos" tone="inherit" style={{ textDecoration: "none", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }} />
            <Text as="h2" variant="heading" text={catalog.system.name} />
            <Stack direction="row" gap="sm" align="center">
              <Badge label="draft" />
              <Text as="span" variant="caption" tone="secondary" text={`v${catalog.system.version}`} />
            </Stack>
          </Stack>
          <SideNav ds={ds} />
          <div className="side-foot">
            <ThemeToggle themes={["light", ...catalog.system.themes.map((t) => t.name)]} />
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </Elos>
  );
}
