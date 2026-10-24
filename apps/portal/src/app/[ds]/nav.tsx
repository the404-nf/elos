"use client";
// The app nav row on the Bloom header: Elos, the system switcher, the areas as pills, the theme toggle.
import { usePathname } from "next/navigation";
import { useCatalog } from "@elos/react";
import { GoButton, Icon, Link, Nav, NavItem, Stack, ThemeToggle } from "@/components/elos-client.tsx";

const ITEMS = [
  ["", "Home"],
  ["/tokens", "Tokens"],
  ["/components", "Components"],
  ["/pages", "Pages"],
  ["/screens", "Screens"],
  ["/versions", "Versions"],
] as const;

export function TopNav() {
  const path = usePathname();
  const systemName = useCatalog().system.name;
  const ds = path.split("/")[1] ?? "";
  return (
    <>
      <Link href="/" label="Elos" tone="inherit" style={{ textDecoration: "none", fontFamily: "var(--font-family-display)", fontWeight: "var(--font-weight-extrabold)", letterSpacing: "-0.02em", fontSize: "var(--font-size-lg)" }} />
      <GoButton href="/" label={systemName} variant="glass" size="sm" icon={<Icon name="chevron-down" size="sm" />} />
      <Nav
        label="Areas"
        orientation="horizontal"
        list={ITEMS.map(([suffix, label]) => {
          const href = `/${ds}${suffix}`;
          return <NavItem key={href} href={href} label={label} tone="bloom" current={suffix === "" ? path === href : path.startsWith(href)} />;
        })}
      />
      <Stack direction="row" gap="sm" align="center" style={{ marginLeft: "auto" }}>
        <ThemeToggle />
      </Stack>
    </>
  );
}
