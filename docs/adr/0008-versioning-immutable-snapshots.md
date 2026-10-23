# 0008. Versioning as immutable snapshots with per-component rollback

Status: Accepted, 2026-10-23

## Context

Users edit tokens and contracts live in the portal and then deploy into a versioned design system. Rollback is required, both of a single component and of the whole system. Clients work differently: some push every edit, some bundle changes into a release. Diffs, as on GitHub, help people understand a version.

## Decision

Each design system has one draft and an append-only list of immutable versions. A version is a full snapshot of the directory format (ADR 0004) with a semver number. Snapshots are small, so they are stored whole; no deltas.

Publishing per change or as a bundle are the same operation: cutting a snapshot. Only the timing differs, and the portal offers both.

Diffs are computed on demand between any two versions, at component and token granularity.

Rollback of one component copies that contract from an older snapshot into the draft, then publishes. Rollback of the whole system republishes an older snapshot as a new version. History is never rewritten. Clients pin versions.

## Consequences

- Every published artifact (catalog, CSS, package) corresponds to exactly one immutable version.
- Draft editing is last-write-wins for now (see 0012).
- Deltas or git-backed storage can replace whole snapshots later without changing the version model.
