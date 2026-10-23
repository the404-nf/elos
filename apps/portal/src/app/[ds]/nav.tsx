"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["", "Overview"],
  ["/tokens", "Tokens"],
  ["/components", "Components"],
  ["/versions", "Versions"],
] as const;

export function SideNav({ ds }: { ds: string }) {
  const path = usePathname();
  return (
    <nav>
      {ITEMS.map(([suffix, label]) => {
        const href = `/${ds}${suffix}`;
        const current = suffix === "" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={current ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
