#!/usr/bin/env node
// stdio MCP server. Usage: node packages/mcp/src/server.ts <system-dir | catalog.json>
import { readFileSync, statSync } from "node:fs";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Catalog } from "@elos/contracts";
import { loadSystem } from "@elos/core";
import { createServer } from "./index.ts";

const source = process.argv[2];
if (!source) {
  console.error("usage: elos-mcp <system-dir | catalog.json>");
  process.exit(1);
}
const catalog = statSync(source).isDirectory() ? loadSystem(source) : Catalog.parse(JSON.parse(readFileSync(source, "utf8")));
await createServer(catalog).connect(new StdioServerTransport());
