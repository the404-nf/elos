"use client";
// The app nav row on the Bloom header: Elos, the system, the areas as pills, the theme toggle.
import { usePathname } from "next/navigation";
import { Link, Nav, NavItem, Stack, Text, ThemeToggle } from "@/components/elos-client.tsx";

const ITEMS = [
  ["", "Home"],
  ["/tokens", "Tokens"],
  ["/components", "Components"],
  ["/pages", "Pages"],
  ["/versions", "Versions"],
] as const;

export function TopNav() {
  const path = usePathname();
  const ds = path.split("/")[1] ?? "";
  return (
    <>
      <Link href="/" label="Elos" tone="inherit" style={{ textDecoration: "none", fontFamily: "var(--font-family-display)", fontWeight: "var(--font-weight-extrabold)", letterSpacing: "-0.02em" }} />
      <Text as="span" variant="caption" text={ds} style={{ opacity: 0.8 }} />
      <Nav
        label="Areas"
        orientation="horizontal"
        list={ITEMS.map(([suffix, label]) => {
          const href = `/${ds}${suffix}`;
          return <NavItem key={href} href={href} label={label} current={suffix === "" ? path === href : path.startsWith(href)} />;
        })}
      />
      <Stack direction="row" gap="sm" align="center" style={{ marginLeft: "auto" }}>
        <ThemeToggle />
      </Stack>
    </>
  );
}
