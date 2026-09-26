import Link from "next/link";
import type { ReactNode } from "react";
import { NavLinks, type NavItem } from "@/components/shared/nav-links";

export type { NavItem };

/**
 * Shared top navigation bar used by both the candidate and company app shells.
 * `items` are the section links; `actions` is the right-hand slot (status
 * badge, account menu, etc.). On phones the links move to a second,
 * horizontally scrollable row so nothing — like Sign out — falls off-screen.
 */
export function TopNav({
  brandHref,
  brandSuffix,
  items,
  actions,
}: {
  brandHref: string;
  /** Shown after "Reverse" from the sm breakpoint, e.g. "for Recruiters". */
  brandSuffix?: string;
  items: NavItem[];
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-background/80 backdrop-blur dark:border-white/10">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 md:gap-6">
        <Link href={brandHref} className="shrink-0 text-base font-semibold tracking-tight">
          Reverse
          {brandSuffix ? <span className="hidden sm:inline"> {brandSuffix}</span> : null}
        </Link>
        <NavLinks items={items} className="hidden md:flex" />
        {actions ? <div className="ml-auto">{actions}</div> : null}
      </nav>
      <NavLinks items={items} compact className="flex overflow-x-auto px-3 pb-2 md:hidden" />
    </header>
  );
}
