import Link from "next/link";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string };

/**
 * Shared top navigation bar used by both the candidate and company app shells.
 * `items` are the section links; `actions` is the right-hand slot (status
 * toggle, subscription badge, account menu, etc.).
 */
export function TopNav({
  brandHref,
  brandLabel = "Reverse",
  items,
  actions,
}: {
  brandHref: string;
  brandLabel?: string;
  items: NavItem[];
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-background/80 backdrop-blur dark:border-white/10">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <Link href={brandHref} className="text-base font-semibold tracking-tight">
          {brandLabel}
        </Link>
        <ul className="flex items-center gap-5 text-sm text-zinc-600 dark:text-zinc-300">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {actions ? <div className="ml-auto">{actions}</div> : null}
      </nav>
    </header>
  );
}
