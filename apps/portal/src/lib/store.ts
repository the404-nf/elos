// The store: drafts and versions as file maps, catalogs built from them. Every mutation validates
// by building the catalog first, so an invalid draft is never saved.
import { join } from "node:path";
import { desc, eq } from "drizzle-orm";
import type { Catalog } from "@elos/contracts";
import { buildCatalog, type SystemFiles } from "@elos/core/catalog";
import { readSystemFiles } from "@elos/core";
import { db } from "./db.ts";
import { designSystems, drafts, organizations, versions } from "./schema.ts";

const RESONANT_DIR = process.env.RESONANT_DIR ?? join(process.cwd(), "..", "..", "Resonant DS");

/** First run: one organization (Elos) with Resonant as its draft, read from the repository directory.
 *  Idempotent and memoized per process: concurrent first requests must not race each other. */
const g = globalThis as unknown as { __elosSeed?: Promise<void> };
function seed(): Promise<void> {
  g.__elosSeed ??= (async () => {
    const d = await db();
    if ((await d.select().from(designSystems).limit(1)).length) return;
    const files = readSystemFiles(RESONANT_DIR);
    const system = files["system.json"] as { id: string; name: string };
    await d.insert(organizations).values({ id: "elos", name: "Elos" }).onConflictDoNothing();
    await d.insert(designSystems).values({ id: system.id, orgId: "elos", name: system.name }).onConflictDoNothing();
    await d.insert(drafts).values({ designSystemId: system.id, files }).onConflictDoNothing();
  })().catch((e) => {
    g.__elosSeed = undefined;
    throw e;
  });
  return g.__elosSeed;
}

export async function listSystems() {
  await seed();
  return (await db()).select().from(designSystems);
}

export async function getDraft(slug: string): Promise<{ files: SystemFiles; catalog: Catalog; updatedAt: Date }> {
  await seed();
  const [row] = await (await db()).select().from(drafts).where(eq(drafts.designSystemId, slug));
  if (!row) throw new Error(`No design system "${slug}"`);
  return { files: row.files, catalog: buildCatalog(row.files), updatedAt: row.updatedAt };
}

/** Replaces one file of the draft after validating the whole system. Returns the new catalog or throws. */
export async function saveDraftFile(slug: string, path: string, content: unknown): Promise<Catalog> {
  const { files } = await getDraft(slug);
  const next = { ...files, [path]: content };
  const catalog = buildCatalog(next); // throws with every error if invalid
  await (await db()).update(drafts).set({ files: next, updatedAt: new Date() }).where(eq(drafts.designSystemId, slug));
  return catalog;
}

export async function listVersions(slug: string) {
  await seed();
  return (await db())
    .select({ id: versions.id, version: versions.version, note: versions.note, createdAt: versions.createdAt })
    .from(versions)
    .where(eq(versions.designSystemId, slug))
    .orderBy(desc(versions.id));
}

export async function getVersion(slug: string, id: number) {
  const [row] = await (await db()).select().from(versions).where(eq(versions.id, id));
  if (!row || row.designSystemId !== slug) throw new Error(`No version ${id}`);
  return row;
}

/** Cuts an immutable snapshot of the draft. The manifest's version is bumped in the draft and the snapshot. */
export async function publish(slug: string, bump: "patch" | "minor" | "major", note: string) {
  const { files } = await getDraft(slug);
  const system = files["system.json"] as { version: string };
  const [ma, mi, pa] = system.version.split(".").map(Number) as [number, number, number];
  const version = bump === "major" ? `${ma + 1}.0.0` : bump === "minor" ? `${ma}.${mi + 1}.0` : `${ma}.${mi}.${pa + 1}`;
  const next = { ...files, "system.json": { ...system, version } };
  buildCatalog(next);
  const d = await db();
  await d.update(drafts).set({ files: next, updatedAt: new Date() }).where(eq(drafts.designSystemId, slug));
  await d.insert(versions).values({ designSystemId: slug, version, files: next, note: note || null });
  return version;
}

/** Rollback: the old snapshot becomes the draft again (history is never rewritten; publish to make it a version). */
export async function restore(slug: string, id: number, onlyPath?: string) {
  const old = await getVersion(slug, id);
  const { files } = await getDraft(slug);
  const next = onlyPath ? { ...files, [onlyPath]: old.files[onlyPath] } : { ...old.files, "system.json": files["system.json"] };
  buildCatalog(next);
  await (await db()).update(drafts).set({ files: next, updatedAt: new Date() }).where(eq(drafts.designSystemId, slug));
}

/** Every version with its files, newest first; small systems make this cheap and the diffs need the files. */
export async function allVersions(slug: string) {
  await seed();
  return (await db()).select().from(versions).where(eq(versions.designSystemId, slug)).orderBy(desc(versions.id));
}

/** The file that holds a contract, by id. */
export function contractPath(files: SystemFiles, id: string): string | undefined {
  return Object.keys(files).find((p) => p.endsWith(".contract.json") && (files[p] as { id?: string })?.id === id);
}

/** Paths whose content differs between two file maps. */
export function diffFiles(a: SystemFiles, b: SystemFiles): string[] {
  const paths = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...paths].filter((p) => JSON.stringify(a[p]) !== JSON.stringify(b[p])).sort();
}
