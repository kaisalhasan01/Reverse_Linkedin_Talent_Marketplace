"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; /** Used in the phone row. */ short?: string };

/** Section links with the current page highlighted (client-side: needs the pathname). */
export function NavLinks({
  items,
  compact,
  className,
}: {
  items: NavItem[];
  compact?: boolean;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <ul className={cn("items-center gap-1 text-sm", className)}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-full px-3 py-1.5 transition-colors",
                active
                  ? "bg-black/5 font-medium text-foreground dark:bg-white/10"
                  : "text-zinc-600 hover:text-foreground dark:text-zinc-300",
              )}
            >
              {compact ? (item.short ?? item.label) : item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
