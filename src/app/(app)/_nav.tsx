"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/criteria", label: "Criteria" },
  { href: "/apartments", label: "Apartments" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-0 px-4">
      {NAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
