# 0007. Portal stack: Next.js, Postgres, Better Auth, TS MCP SDK, self-hostable

Status: Accepted, 2026-10-23

## Context

The portal must serve humans a UI, agents an MCP endpoint and everyone a REST API from the same data. Clients will require self-hosting for governance. The team is small and the stack should be boring.

## Decision

- Next.js with the App Router. Pages, REST route handlers and the MCP endpoint in one deploy.
- Postgres through Drizzle. Contracts and tokens stored as versioned jsonb. Full-text search first; pgvector when semantic lookup is needed.
- Better Auth for authentication.
- The official TypeScript MCP SDK over stateless Streamable HTTP, mounted as a route handler.
- Self-hostable from day one: a Docker image plus Postgres, with no vendor-specific storage, queues or functions. Hosting choice is deferred to deployment.
- Zag.js inside the React renderer (see 0009).

Not adopted: Storybook (see 0011), a separate API service, a vector database, a private registry (the portal serves package tarballs until a registry is justified).

## Consequences

- One codebase, one language, one deploy.
- Vercel-only or Cloudflare-only features are off limits.
- The database schema is designed for tenancy from the first migration (see 0010).
