"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Screen } from "@elos/contracts";
import { getDraft, saveDraftFile } from "@/lib/store.ts";

/** The file that holds a screen, by id. */
const screenPath = (files: Record<string, unknown>, id: string) => Object.keys(files).find((p) => p.endsWith(".screen.json") && (files[p] as { id?: string })?.id === id);

/** Replaces a screen in the draft after the whole system validates (the tree against the catalog included). */
export async function saveScreen(ds: string, screen: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const parsed = Screen.parse(screen);
    const { files, catalog } = await getDraft(ds);
    const path = screenPath(files, parsed.id) ?? `${catalog.system.screens}/${parsed.id.replace(/^screen\./, "")}.screen.json`;
    await saveDraftFile(ds, path, parsed);
    revalidatePath(`/${ds}`, "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Creates an empty screen (a column stack) from a name and opens it on the canvas. */
export async function createScreen(ds: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) return;
  const screen = Screen.parse({ id: `screen.${slug}`, name, tree: { component: "ds.stack", props: { gap: "lg" }, slots: { root: [] } } });
  const { catalog } = await getDraft(ds);
  await saveDraftFile(ds, `${catalog.system.screens}/${slug}.screen.json`, screen);
  revalidatePath(`/${ds}`, "layout");
  redirect(`/${ds}/screens/${screen.id}`);
}
