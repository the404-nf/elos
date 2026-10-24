import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { emitCss } from "@elos/core/css";
import { emitComponentsCss } from "@elos/core/catalog";
import { getDraft } from "@/lib/store.ts";
import { Elos } from "@/components/elos-client.tsx";

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
      <div className="page">{children}</div>
    </Elos>
  );
}
