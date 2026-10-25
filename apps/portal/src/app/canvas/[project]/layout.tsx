import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { emitCss } from "@elos/core/css";
import { emitComponentsCss } from "@elos/core/catalog";
import { getProject } from "@/lib/canvas-store.ts";
import { Elos } from "@/components/elos-client.tsx";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const p = await getProject(project).catch(() => undefined);
  return { title: p ? `${p.project.name} · Canvas · Elos` : "Canvas · Elos" };
}

/** Full screen: the bound system's CSS and catalog, none of the design system chrome (ADR 0017). */
export default async function CanvasLayout({ params, children }: { params: Promise<{ project: string }>; children: ReactNode }) {
  const { project } = await params;
  const { catalog } = await getProject(project).catch(() => notFound());
  const css = emitCss(catalog) + "\n" + emitComponentsCss(catalog);
  return (
    <Elos catalog={catalog}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </Elos>
  );
}
