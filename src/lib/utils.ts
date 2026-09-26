import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts so the last class wins
 * (e.g. `cn("px-2", isActive && "px-4")` -> `px-4`). Used by every component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
