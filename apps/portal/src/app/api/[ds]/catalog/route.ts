import { buildCatalog } from "@elos/core/catalog";
import { getDraft, getVersion } from "@/lib/store.ts";

export const dynamic = "force-dynamic";

/** GET /api/<ds>/catalog            the draft catalog
 *  GET /api/<ds>/catalog?version=3  the catalog of an immutable version */
export async function GET(req: Request, { params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const version = new URL(req.url).searchParams.get("version");
  try {
    const catalog = version ? buildCatalog((await getVersion(ds, Number(version))).files) : (await getDraft(ds)).catalog;
    return Response.json(catalog);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 404 });
  }
}
