// Postgres through Drizzle. DATABASE_URL -> real Postgres (self-hosting); otherwise an embedded PGlite in .data/.
import { sql } from "drizzle-orm";
import * as schema from "./schema.ts";

type Db = Awaited<ReturnType<typeof connect>>;

async function connect() {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { default: pg } = await import("pg");
    return drizzle(new pg.Pool({ connectionString: process.env.DATABASE_URL }), { schema });
  }
  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  mkdirSync(dir, { recursive: true });
  return drizzle(new PGlite(dir), { schema });
}

// One connection per process; Next's dev server re-evaluates modules, so keep it on globalThis.
const g = globalThis as unknown as { __elosDb?: Promise<Db> };

export function db(): Promise<Db> {
  g.__elosDb ??= connect()
    .then(async (d) => {
      for (const stmt of schema.CREATE_SQL.split(";").map((s) => s.trim()).filter(Boolean)) await d.execute(sql.raw(stmt));
      return d;
    })
    .catch((e) => {
      g.__elosDb = undefined; // never cache a failed connection
      throw e;
    });
  return g.__elosDb;
}
