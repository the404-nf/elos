# 0001. Contracts are the source of truth

Status: Accepted, 2026-10-23

## Context

The frontend stack for the Elos portal was undecided when work started, and the design system must be consumed by humans, by agents through MCP and REST, and on channels with no UI at all. A component library in one framework cannot serve all of that. The reference points were Southleft's ds-contracts-poc (a machine-readable contract per component, deterministic generation, no AI in the conversion path) and OpenUI (a library spec that constrains what a model may generate).

## Decision

Every component and token is described by a contract: a JSON document validated by a Zod schema in `packages/contracts`. A contract declares identity, props, states, anatomy with token bindings, slots and nested references, accessibility requirements, usage rules, relationships, channel support and examples. Renderers, the portal, REST and MCP all consume a catalog built from contracts. Nothing is inferred from component source code.

Usage guidance is enumerable (short statements, intents, ids), never free prose, so lookup by an agent is deterministic.

## Consequences

- The render layer becomes a target that can be added when a stack is chosen. Contracts and tokens need no framework.
- The schema is a public interface. Changes to it follow semver and get a record of their own.
- Writing a contract is more work than writing a component. That cost is the product.
