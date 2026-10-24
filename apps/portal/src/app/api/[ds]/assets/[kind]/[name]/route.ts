import { getDraft } from "@/lib/store.ts";

export const dynamic = "force-dynamic";

/** GET /api/<ds>/assets/<kind>/<name>.svg  one icon or illustration of the draft, as the file in the directory. */
export async function GET(_req: Request, { params }: { params: Promise<{ ds: string; kind: string; name: string }> }) {
  const { ds, kind, name } = await params;
  const { catalog } = await getDraft(ds);
  const svg = catalog.assets[kind]?.[name.replace(/\.svg$/, "")];
  if (!svg) return new Response("Not found", { status: 404 });
  return new Response(svg, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "no-store" } });
}
