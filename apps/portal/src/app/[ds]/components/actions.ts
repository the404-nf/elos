"use server";
import { revalidatePath } from "next/cache";
import { Contract } from "@elos/contracts";
import { contractPath, getDraft, saveDraftFile } from "@/lib/store.ts";

/** Replaces a contract in the draft after full validation (schema, token refs, references). */
export async function saveContract(ds: string, contract: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const parsed = Contract.parse(contract);
    const { files } = await getDraft(ds);
    const path = contractPath(files, parsed.id);
    if (!path) return { ok: false, error: `No contract file for ${parsed.id}` };
    await saveDraftFile(ds, path, parsed);
    revalidatePath(`/${ds}`, "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
