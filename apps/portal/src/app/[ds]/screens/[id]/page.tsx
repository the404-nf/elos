import { notFound } from "next/navigation";
import { getDraft } from "@/lib/store.ts";
import { ScreenEditor } from "./editor.tsx";

export default async function ScreenPage({ params }: { params: Promise<{ ds: string; id: string }> }) {
  const { ds, id } = await params;
  const { catalog } = await getDraft(ds);
  const screen = catalog.screens.find((s) => s.id === id);
  if (!screen) notFound();
  return <ScreenEditor ds={ds} screen={screen} catalog={catalog} />;
}
