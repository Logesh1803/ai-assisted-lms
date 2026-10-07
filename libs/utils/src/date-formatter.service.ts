import { DateTime } from "luxon";

// Milliseconds since the Unix epoch. Example: 1700000000000
export function getCurrentUnixTimestamp(): bigint{
  return BigInt(DateTime.now().toMillis());
}

export function getUnixTimestampPlusSeconds(secondsToAdd: number): bigint {
  return BigInt(DateTime.now().plus({ seconds: secondsToAdd }).toMillis());
}

export function getUnixTimestampPlusDays(daysToAdd: number): bigint {
  return BigInt(DateTime.now().plus({ days: daysToAdd }).toMillis());
}

// Example: "14-11-2023 06:53"
export function formatUnixTimestamp(
  unix: number = 0,
  timezone: "Asia/Kolkata" | "GMT" | "utc" = "utc",
  format: string = "dd-MM-yyyy HH:mm",
): string | null {
  return DateTime.fromMillis(unix, { zone: timezone }).toFormat(format);
}
export function utcNow() {
  return DateTime.utc().toJSDate();
}

export function utcDateAddDays(days: number = 1) {
  return DateTime.utc().plus({ days }).startOf("day").toJSDate();
}
export function utcDateAddDaysWithCurrentTime(days: number = 1) {
  return DateTime.utc().plus({ days }).toJSDate();
}
export function utcDateSubtractDays(days: number = 1) {
  return DateTime.utc().minus({ days }).startOf("day").toJSDate();
}

// Example: "2 days ago"
export function timeAgo(unix: number = 0): string | null {
  return DateTime.fromMillis(unix).toRelative();
}
export function getTimestamps(action: "create"): {
  created_at: bigint;
  updated_at: bigint;
};
export function getTimestamps(action: "update"): { updated_at: bigint };
export function getTimestamps(action: "create" | "update") {
  const now = getCurrentUnixTimestamp();

  if (action === "create") {
    return {
      created_at: now,
      updated_at: now,
    };
  }

  if (action === "update") {
    return {
      updated_at: now,
    };
  }
}
export function getAzureFirewallTimestamps() {
  return DateTime.utc().toFormat("yyyy-MM-dd_HH-mm-ss");
}
