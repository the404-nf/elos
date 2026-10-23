# 0013. Platform areas: Design Systems, Marketplace, Canvas, Serve

Status: Accepted, 2026-10-24

## Context

The founder set the final form of the platform in a diagram with three areas: Design Systems (view, inspect, edit, version, audit and report), Marketplace (governed assets such as principles, design decision records, agents and skills), and Canvas (compose screens and journeys with a bring-your-own model, version them, bind to OpenAPI contracts). REST and MCP were already decided as the way everything is consumed.

## Decision

Elos is organized into four areas. The three from the diagram are what users see. The fourth, Serve, is how every area reaches humans and agents: REST, MCP over stdio and Streamable HTTP, exports and generated skills, versioned packages. Serve is named so it is designed once.

All four areas share one spine: the system directory with schemas, the catalog built from it, and the draft plus immutable versions. No area gets storage or a format of its own. Marketplace assets are files in the directory, owned by a system and inheritable from an organization base. Canvas screens are composition trees stored as files and validated against the catalog and the product's OpenAPI operations. Elos receives models; it does not serve them.

Order: Design Systems first, Marketplace second, Canvas third. The full text is [docs/vision.md](../vision.md).

## Consequences

- Every new capability is first a schema for a file in the directory, then a catalog field, then a Serve surface, then a screen in the portal. That order is the test of whether it belongs.
- Audit and reports are generated from the catalog, not scanned from code.
- Bring-your-own model is possible because the model only needs the catalog and OpenAPI vocabularies, never the renderer.
- Versioning of screens, assets and components is one mechanism.
