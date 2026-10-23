"use client";
// Client side of the portal: the Resonant provider with behaviors, the typed components the chrome is
// composed from, and the theme switch. The portal is built from the system it shows; nothing here is markup.
import { useEffect, useState, type ChangeEvent, type CSSProperties, type ElementType, type FocusEvent, type ReactNode } from "react";
import NextLink from "next/link";
import type { Catalog } from "@elos/contracts";
import { ElosProvider, Render, createComponent, type Node } from "@elos/react";
import { zagBehaviors } from "@elos/react/behaviors";

/** Every contract anchor renders as a router link, so navigation inside the portal is a soft transition. */
export const elements = { a: NextLink as ElementType };

export function Elos({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  return (
    <ElosProvider catalog={catalog} behaviors={zagBehaviors} elements={elements}>
      {children}
    </ElosProvider>
  );
}

export { Render };
export type { Node };

type Dom = { id?: string; title?: string; style?: CSSProperties; "aria-label"?: string; "aria-pressed"?: boolean; inert?: boolean };
type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const Button = createComponent<Dom & { label: string; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void; icon?: ReactNode }>("ds.button");
export const Badge = createComponent<Dom & { label: string; tone?: Tone }>("ds.badge");
export const Text = createComponent<Dom & { text: string; as?: "p" | "span" | "h1" | "h2" | "h3"; variant?: "title" | "heading" | "body" | "caption"; tone?: "primary" | "secondary" }>("ds.text");
export const Stack = createComponent<Dom & { direction?: "row" | "column"; gap?: "xs" | "sm" | "md" | "lg"; align?: "start" | "center" | "end" | "stretch" }>("ds.stack");
export const Card = createComponent<Dom & { title?: string; heading?: "h2" | "h3"; padding?: "md" | "lg"; actions?: ReactNode; body?: ReactNode }>("ds.card");
export const Link = createComponent<Dom & { href: string; label: string; tone?: "link" | "inherit" }>("ds.link");
export const Nav = createComponent<Dom & { label: string; list: ReactNode }>("ds.nav");
export const NavItem = createComponent<Dom & { href: string; label: string; current?: boolean }>("ds.nav-item");
export const Breadcrumb = createComponent<Dom & { label?: string; list: ReactNode }>("ds.breadcrumb");
export const BreadcrumbItem = createComponent<Dom & { href: string; label: string; current?: boolean; separator?: string }>("ds.breadcrumb-item");
export const Separator = createComponent<Dom & { orientation?: "horizontal" | "vertical" }>("ds.separator");
export const Alert = createComponent<Dom & { tone?: Tone; title: string; description?: string }>("ds.alert");

type Control = Dom & {
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  list?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement & HTMLInputElement>) => void;
};
export const Input = createComponent<Control & { type?: "text" | "email" | "password" | "number" | "search"; placeholder?: string; size?: "sm" | "md" }>("ds.input");
export const Textarea = createComponent<Control & { placeholder?: string; rows?: number }>("ds.textarea");
export const Select = createComponent<Control & { size?: "sm" | "md" }>("ds.select");
export const Option = createComponent<{ value: string; label: string }>("ds.option");
export const Field = createComponent<Dom & { label: string; help?: string; error?: string }>("ds.field");
export const Checkbox = createComponent<Dom & { label: string; name?: string; checked?: boolean; disabled?: boolean; onChange?: (e: ChangeEvent<HTMLInputElement>) => void }>("ds.checkbox");

export const Table = createComponent<Dom & { caption?: string; head?: ReactNode; body: ReactNode }>("ds.table");
export const TableRow = createComponent<Dom>("ds.table-row");
export const TableCell = createComponent<Dom & { as?: "td" | "th"; align?: "start" | "end" }>("ds.table-cell");

export const Dialog = createComponent<Dom & { title: string; description?: string; open?: boolean; trigger: ReactNode; actions?: ReactNode }>("ds.dialog");

/** Options for a select: labels are the values in sentence case unless given. */
export const options = (values: readonly string[], labels?: Record<string, string>) =>
  values.map((v) => <Option key={v} value={v} label={labels?.[v] ?? v.charAt(0).toUpperCase() + v.slice(1)} />);

export function ThemeToggle({ themes }: { themes: string[] }) {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
  }, []);
  const apply = (t: string) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("elos-theme", t);
    } catch {}
  };
  return (
    <Field label="Theme">
      <Select size="sm" value={theme} onChange={(e) => apply(e.target.value)}>{options(themes)}</Select>
    </Field>
  );
}
