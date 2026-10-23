"use client";
// Client side of the portal: the Resonant provider with behaviors, the typed components the chrome uses,
// and the theme toggle. The portal is built from the system it shows.
import { useEffect, useState, type ReactNode } from "react";
import type { Catalog } from "@elos/contracts";
import { ElosProvider, Render, createComponent, type Node } from "@elos/react";
import { zagBehaviors } from "@elos/react/behaviors";

export function Elos({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  return (
    <ElosProvider catalog={catalog} behaviors={zagBehaviors}>
      {children}
    </ElosProvider>
  );
}

export { Render };
export type { Node };

export const Button = createComponent<{ label: string; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; disabled?: boolean }>("ds.button");
export const Badge = createComponent<{ label: string; tone?: "neutral" | "info" | "success" | "warning" | "danger" }>("ds.badge");
export const Text = createComponent<{ text: string; as?: "p" | "span" | "h1" | "h2" | "h3"; variant?: "title" | "heading" | "body" | "caption"; tone?: "primary" | "secondary" }>("ds.text");
export const Stack = createComponent<{ direction?: "row" | "column"; gap?: "sm" | "md" | "lg"; align?: "start" | "center" | "end" | "stretch" }>("ds.stack");
export const Card = createComponent<{ title?: string; padding?: "md" | "lg"; actions?: ReactNode }>("ds.card");

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
    <label className="field">
      Theme
      <select value={theme} onChange={(e) => apply(e.target.value)}>
        {themes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
