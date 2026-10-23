# 0010. Tenancy from day one, API keys before OAuth

Status: Accepted, 2026-10-23

## Context

The MVP serves one organization (Elos, with Resonant), but Elos stores many clients' design systems. Remote MCP access from ChatGPT and Claude Desktop to private systems requires OAuth, which is real work and not needed to start.

## Decision

The database schema is tenant-aware from the first migration: organization, design system, draft, version. No client onboarding flow in the MVP.

Access uses API keys in the MVP. First external agent testing happens through Claude Code and Codex, which work with keys. OAuth for the remote MCP server is milestone six, when ChatGPT and Claude Desktop connect to private systems.

## Consequences

- Adding tenancy later would be a migration across every table; adding it now is one column per table.
- The MCP server is designed stateless so adding OAuth is an authentication layer, not a rewrite.
