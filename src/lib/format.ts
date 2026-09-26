/** Tiny date/format helpers shared across the app. */

/** The moment `days` days before now — e.g. the start of a "this week" window. */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 3600 * 1000);
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function monthYear(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function formatSalaryRange(min?: number | null, max?: number | null, currency = "SEK"): string | null {
  const fmt = (n: number) => n.toLocaleString("sv-SE");
  if (min && max) return `${fmt(min)}–${fmt(max)} ${currency}/month`;
  if (min) return `From ${fmt(min)} ${currency}/month`;
  if (max) return `Up to ${fmt(max)} ${currency}/month`;
  return null;
}
