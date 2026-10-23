import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { emitCss } from "@elos/core/css";
import { emitComponentsCss } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { Elos, ThemeToggle } from "@/components/elos-client.tsx";
import { SideNav } from "./nav.tsx";

export const dynamic = "force-dynamic";

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
          <div>
            <Link href="/" className="muted" style={{ textDecoration: "none", fontSize: 13 }}>
              Elos
            </Link>
            <h2 style={{ margin: 0 }}>{catalog.system.name}</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              draft · v{catalog.system.version}
            </span>
          </div>
          <SideNav ds={ds} />
          <div style={{ marginTop: "auto" }}>
            <ThemeToggle themes={["light", ...catalog.system.themes.map((t) => t.name)]} />
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </Elos>
  );
}
