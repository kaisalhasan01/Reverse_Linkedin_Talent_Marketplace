import { cn } from "@/lib/utils";

/**
 * Initials avatar — deterministic background per name, no image uploads in MVP.
 * Shades chosen so white initials meet WCAG AA (≥ 4.5:1; the -600s of
 * sky/emerald/amber/teal were 3.2–4.0).
 */
const palette = [
  "bg-sky-700",
  "bg-emerald-700",
  "bg-violet-600",
  "bg-rose-700",
  "bg-amber-700",
  "bg-teal-700",
];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        color,
        sizes[size],
      )}
    >
      {initials}
    </span>
  );
}
