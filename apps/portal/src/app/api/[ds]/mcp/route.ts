// Remote MCP over Streamable HTTP, stateless: one server per request over the draft catalog.
// Claude Desktop, Claude Code, ChatGPT and Codex connect to POST /api/<ds>/mcp.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "@elos/mcp";
import { getDraft } from "@/lib/store.ts";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ ds: string }> }) {
  const { ds } = await params;
  const { catalog } = await getDraft(ds);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await createServer(catalog).connect(transport);
  return transport.handleRequest(req);
}

// Stateless servers keep no session: nothing to stream or delete.
export const GET = () => new Response("Use POST", { status: 405 });
export const DELETE = () => new Response(null, { status: 204 });
