// Canvas projects (ADR 0017): directories of their own, bound to a design system by id and version.
// Every mutation builds the project against the bound catalog first, so an invalid project is never saved.
import { eq } from "drizzle-orm";
import type { Catalog } from "@elos/contracts";
import { buildCatalog } from "@elos/core/catalog";
import { buildProject, screenPath, type Project, type ProjectFiles } from "@elos/core/project";
import { db } from "./db.ts";
import { canvasProjects, versions } from "./schema.ts";
import { getDraft, listSystems } from "./store.ts";

export async function listProjects() {
  await listSystems(); // seeds the organization on first run
  return (await db()).select({ id: canvasProjects.id, name: canvasProjects.name, files: canvasProjects.files, updatedAt: canvasProjects.updatedAt }).from(canvasProjects);
}

/** The catalog a project is bound to: a published version's, or the system's draft when the binding says "draft". */
export async function boundCatalog(systemId: string, version: string): Promise<Catalog> {
  if (version === "draft") return (await getDraft(systemId)).catalog;
  const rows = await (await db()).select().from(versions).where(eq(versions.designSystemId, systemId));
  const row = rows.find((r) => r.version === version);
  if (!row) throw new Error(`${systemId} has no published version ${version}`);
  return buildCatalog(row.files);
}

export async function getProject(id: string): Promise<{ files: ProjectFiles; catalog: Catalog } & Project> {
  const [row] = await (await db()).select().from(canvasProjects).where(eq(canvasProjects.id, id));
  if (!row) throw new Error(`No project "${id}"`);
  const manifest = row.files["project.json"] as { system: { id: string; version: string } };
  const catalog = await boundCatalog(manifest.system.id, manifest.system.version);
  return { files: row.files, catalog, ...buildProject(row.files, catalog) };
}

export async function createProject(id: string, name: string, systemId: string, version: string) {
  const catalog = await boundCatalog(systemId, version);
  const files: ProjectFiles = { "project.json": { id, name, system: { id: systemId, version } } };
  buildProject(files, catalog);
  await (await db()).insert(canvasProjects).values({ id, orgId: "elos", name, files });
}

/** Replaces the project's screens: each one written to its file, files of removed screens dropped. Validates first. */
export async function saveScreens(id: string, screens: unknown[]): Promise<Project> {
  const { files, catalog, project } = await getProject(id);
  const next: ProjectFiles = Object.fromEntries(Object.entries(files).filter(([p]) => !p.startsWith(`${project.screens}/`)));
  for (const s of screens as { id: string }[]) next[screenPath(project, s.id)] = s;
  const built = buildProject(next, catalog);
  await (await db()).update(canvasProjects).set({ files: next, updatedAt: new Date() }).where(eq(canvasProjects.id, id));
  return built;
}
