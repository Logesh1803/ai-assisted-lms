import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names, letting later classes win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Renders a timestamp as a plain date, e.g. "5 Sep 2026". */
export function formatDate(timestamp: number | bigint | string): string {
  return new Date(Number(timestamp)).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Turns a number of seconds into "m:ss", e.g. 95 -> "1:35". */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Short "how long ago" label: "just now", "5m", "3h", "2d", and a plain date
 * once the timestamp is more than a week old.
 */
export function timeAgo(timestamp: string | number | bigint): string {
  const millisecondsAgo = Date.now() - Number(timestamp);
  const minutes = Math.floor(millisecondsAgo / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(Number(timestamp)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * First letters of a person's name for an avatar, e.g. "Ada Lovelace" -> "AL".
 * Falls back to "?" while a name is still loading or missing.
 */
export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

/** Background colours an avatar can be given when there is no photo. */
export const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
];

/**
 * Picks one of AVATAR_COLORS for a name. The same name always gets the same
 * colour, so a person looks consistent everywhere they appear.
 */
export function avatarColor(name = ""): string {
  let characterSum = 0;
  for (let index = 0; index < name.length; index++) {
    characterSum += name.charCodeAt(index);
  }
  return AVATAR_COLORS[characterSum % AVATAR_COLORS.length];
}
