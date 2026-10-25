import { getProject } from "@/lib/canvas-store.ts";
import { Board } from "./board.tsx";

export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const p = await getProject(project);
  return <Board project={p.project} screens={p.screens} catalog={p.catalog} />;
}
