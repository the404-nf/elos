# 0012. Deferred: Figma, import, multiplayer, structured governance docs

Status: Accepted, 2026-10-23

## Context

Several capabilities are wanted but not for the MVP. Each is recorded here so the foundation leaves room for it and so nobody rediscovers the decision.

## Decision

| Capability | Status | Room left |
|---|---|---|
| Figma token and component sync | Later | Tokens are DTCG, readable by Figma plugins. Southleft's ds-contracts-poc is the reference for component sync. |
| Importing an existing component library | Later, not urgent | The directory format (ADR 0004) is the importer's target. A code reader produces contracts; it does not need a new storage path. |
| Multiplayer editing | Later, handle with care | Draft editing is last-write-wins. The draft is a single document per design system, which a CRDT or operational transform can replace. |
| Principles, DDRs, skills, agents, contexts as structured data | Later, to discuss | They become JSON or YAML files in the same directory with their own Zod schemas, versioned with the system. Skills follow the SKILL.md convention so agents consume them directly from the platform. Governance is part of the moat. |
| OpenUI Lang and A2UI adapters | Milestone six | Both parse into the composition tree (ADR 0005). |
| Private package registry | When justified | The portal serves tarballs until then. |

## Consequences

- None of these requires a change to the contract schema, the directory format or the version model when added.
- Each becomes its own record when taken up.
