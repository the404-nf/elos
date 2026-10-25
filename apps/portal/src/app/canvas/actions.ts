"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProject, saveScreens } from "@/lib/canvas-store.ts";

export async function createProjectAction(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const [systemId, version] = String(form.get("binding") ?? "").split("@");
  const id = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!id || !systemId || !version) return;
  await createProject(id, name, systemId, version);
  revalidatePath("/");
  redirect(`/canvas/${id}`);
}

/** Replaces the project's screens after the whole project validates against the bound catalog. */
export async function saveScreensAction(id: string, screens: unknown[]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await saveScreens(id, screens);
    revalidatePath(`/canvas/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
