import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-foreground text-background hover:opacity-90 disabled:opacity-50",
  outline:
    "border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10 disabled:opacity-50",
  ghost: "hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50",
  danger:
    "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
} as const;

type ButtonLook = { variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string };

/**
 * Button look as a class string — for links that should look like buttons.
 * (Wrapping a <Button> in a <Link> nests a button inside an anchor: invalid
 * HTML, announced oddly by screen readers, and two tab stops for one action.)
 */
export function buttonStyles({ variant = "primary", size = "md", className }: ButtonLook = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonLook) {
  return <button className={buttonStyles({ variant, size, className })} {...props} />;
}
