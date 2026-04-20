"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Ranking", exact: true },
  { href: "/apartments", label: "Apartments" },
  { href: "/map", label: "Map" },
  { href: "/criteria", label: "Criteria" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-0 px-4">
      {NAV_LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
