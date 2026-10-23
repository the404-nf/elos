"use server";
import { revalidatePath } from "next/cache";
import { publish, restore } from "@/lib/store.ts";

export async function publishAction(ds: string, formData: FormData) {
  const bump = String(formData.get("bump") ?? "patch") as "patch" | "minor" | "major";
  await publish(ds, bump, String(formData.get("note") ?? ""));
  revalidatePath(`/${ds}`, "layout");
}

export async function restoreAction(ds: string, formData: FormData) {
  const path = formData.get("path");
  await restore(ds, Number(formData.get("id")), path ? String(path) : undefined);
  revalidatePath(`/${ds}`, "layout");
}
