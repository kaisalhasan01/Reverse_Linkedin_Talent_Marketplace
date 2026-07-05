import type { ReactNode } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";

/** Right side of the top nav: contextual badge, identity, sign out. */
export function UserMenu({ name, badge }: { name: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {badge}
      <span className="hidden items-center gap-2 sm:flex">
        <Avatar name={name} size="sm" />
        <span className="max-w-32 truncate text-sm font-medium">{name}</span>
      </span>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-zinc-500 transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
