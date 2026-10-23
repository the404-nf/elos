"use server";
import { revalidatePath } from "next/cache";
import type { SystemManifest } from "@elos/contracts";
import { getDraft, saveDraftFile } from "@/lib/store.ts";

type Group = Record<string, unknown>;

const getAt = (group: Group, path: string[]): unknown => path.reduce<unknown>((g, k) => (g && typeof g === "object" ? (g as Group)[k] : undefined), group);

function setValue(group: Group, path: string[], value: unknown): Group {
  const [head, ...rest] = path as [string, ...string[]];
  const child = (group[head] as Group | undefined) ?? {};
  return { ...group, [head]: rest.length ? setValue(child, rest, value) : { ...child, $value: value } };
}

/** Parses what the editor typed: a number stays a number, "12px" becomes a DTCG dimension, the rest is a string (alias or color). */
function parseRaw(input: string): unknown {
  const s = input.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  const dim = s.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)$/);
  if (dim) return { value: Number(dim[1]), unit: dim[2] };
  return s;
}

/** Sets a token's raw value in the file that defines it (base) or in the theme's overlay (created if missing). */
export async function saveToken(ds: string, theme: string, path: string, input: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { files } = await getDraft(ds);
    const system = files["system.json"] as SystemManifest;
    const segments = path.split(".");
    let file: string | undefined;
    if (theme === "light") file = [...system.tokens].reverse().find((f) => getAt(files[f] as Group, segments) !== undefined);
    else file = system.themes.find((t) => t.name === theme)?.overlay;
    if (!file) return { ok: false, error: `No file defines ${path} for theme ${theme}` };
    await saveDraftFile(ds, file, setValue((files[file] as Group) ?? {}, segments, parseRaw(input)));
    revalidatePath(`/${ds}`, "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
