import { emitComponentsCss } from "@elos/core/catalog";
import { emitCss } from "@elos/core/css";
import { getDraft } from "@/lib/store.ts";

export const dynamic = "force-dynamic";

/** GET /api/<ds>/css  tokens and component rules of the draft, ready to link from any HTML. */
export async function GET(_req: Request, { params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  return new Response(emitCss(catalog) + "\n" + emitComponentsCss(catalog), { headers: { "content-type": "text/css; charset=utf-8" } });
}
