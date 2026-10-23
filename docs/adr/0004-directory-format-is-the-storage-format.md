# 0004. The on-disk directory is the storage and exchange format

Status: Accepted, 2026-10-23

## Context

Elos must store many clients' design systems, export them on deploy, run self-hosted, and later import existing component libraries. Each of those needs a format. Several formats would drift.

## Decision

A design system is a directory: `system.json`, `tokens/`, `themes/`, `contracts/*.contract.json`. `packages/core` is the only reader. The portal stores versions as snapshots of this directory. Deploy exports it. Self-hosted installs read it. A future importer's job is to produce it.

## Consequences

- Import of an existing library is "write this directory", not a new storage path.
- Git can hold a design system directly, which also serves clients who want their system in their own repository.
- Future governance documents (principles, DDRs, skills) become more files in the same directory with their own schemas.
