import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@elos/contracts", "@elos/core", "@elos/react", "@elos/mcp"],
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default config;
