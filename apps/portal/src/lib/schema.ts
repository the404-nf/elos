// Tenancy from the first migration: organization -> design system -> one draft + immutable versions.
// A draft or version holds the system's files (path -> JSON/text), the same map the on-disk format uses.
import { json, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const designSystems = pgTable("design_systems", {
  id: text("id").primaryKey(), // slug, e.g. "resonant"
  orgId: text("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
});

export const drafts = pgTable("drafts", {
  designSystemId: text("design_system_id").primaryKey().references(() => designSystems.id),
  // json, not jsonb: jsonb sorts object keys, which would reorder anatomy parts and slots. The directory format is order-sensitive.
  files: json("files").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const versions = pgTable("versions", {
  id: serial("id").primaryKey(),
  designSystemId: text("design_system_id").notNull().references(() => designSystems.id),
  version: text("version").notNull(),
  files: json("files").$type<Record<string, unknown>>().notNull(), // full snapshot; diffs are computed
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A Canvas project (ADR 0017): its own directory of files, bound to a design system by id and version inside project.json.
// Kept apart from drafts and versions on purpose: a project is a customer's product, not part of a system.
export const canvasProjects = pgTable("canvas_projects", {
  id: text("id").primaryKey(), // slug
  orgId: text("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  files: json("files").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ponytail: one SQL string instead of drizzle-kit migrations; move to drizzle-kit once the schema changes in production.
export const CREATE_SQL = `
create table if not exists organizations (id text primary key, name text not null);
create table if not exists design_systems (id text primary key, org_id text not null references organizations(id), name text not null);
create table if not exists drafts (design_system_id text primary key references design_systems(id), files json not null, updated_at timestamptz not null default now());
create table if not exists versions (id serial primary key, design_system_id text not null references design_systems(id), version text not null, files json not null, note text, created_at timestamptz not null default now());
create table if not exists canvas_projects (id text primary key, org_id text not null references organizations(id), name text not null, files json not null, updated_at timestamptz not null default now());
`;
