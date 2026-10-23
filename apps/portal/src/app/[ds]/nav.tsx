"use client";
import { usePathname } from "next/navigation";
import { Nav, NavItem } from "@/components/elos-client.tsx";

const ITEMS = [
  ["", "Overview"],
  ["/tokens", "Tokens"],
  ["/components", "Components"],
  ["/pages", "Pages"],
  ["/versions", "Versions"],
] as const;

export function SideNav({ ds }: { ds: string }) {
  const path = usePathname();
  return (
    <Nav
      label="Areas"
      list={ITEMS.map(([suffix, label]) => {
        const href = `/${ds}${suffix}`;
        return <NavItem key={href} href={href} label={label} current={suffix === "" ? path === href : path.startsWith(href)} />;
      })}
    />
  );
}
