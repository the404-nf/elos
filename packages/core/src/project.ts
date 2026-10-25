// A Canvas project (ADR 0017) built from its directory: project.json plus screens/*.screen.json, every tree validated
// against the catalog of the design system the project is bound to. Pure, like buildCatalog; throws with every error listed.
import { CanvasProject, CanvasScreen, type Catalog } from "@elos/contracts";
import { validateComposition } from "./composition.ts";

export type ProjectFiles = Record<string, unknown>;
export type Project = { project: CanvasProject; screens: CanvasScreen[] };

export function buildProject(files: ProjectFiles, catalog: Catalog): Project {
  if (!("project.json" in files)) throw new Error("Missing file project.json");
  const project = CanvasProject.parse(files["project.json"]);
  if (project.system.id !== catalog.system.id) throw new Error(`Project is bound to ${project.system.id}, catalog is ${catalog.system.id}`);
  const prefix = `${project.screens}/`;
  const screens = Object.keys(files)
    .filter((p) => p.startsWith(prefix) && p.endsWith(".screen.json"))
    .sort()
    .map((p) => CanvasScreen.parse(files[p]));
  const errors = screens.flatMap((s) => validateComposition(catalog, s.tree).map((e) => `${s.id}: ${e}`));
  if (errors.length) throw new Error(`Invalid screens:\n  ${errors.join("\n  ")}`);
  return { project, screens };
}

/** The file a screen lives in, inside its project. */
export const screenPath = (project: CanvasProject, id: string) => `${project.screens}/${id.replace(/^screen\./, "")}.screen.json`;
