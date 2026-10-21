import { EVENT_DEADLINE_MS } from "./ph-time";

export const TARGET_SIGILS = 500;
export const WEEKLY_SIGILS = 52;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function acquisitionWeek(projectedAtMs: number) {
  const date = new Date(projectedAtMs);
  const day = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", day: "numeric" }).format(date));
  const month = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "long" }).format(date);
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric" }).format(date));
  return { week: Math.ceil(day / 7), month, year };
}

export function ordinal(n: number) {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}

export function acquisitionPhrase(projectedAtMs: number) {
  const { week, month } = acquisitionWeek(projectedAtMs);
  return `${TARGET_SIGILS} sigils ka na sa ${ordinal(week)} week of ${month}`;
}

export function parseSigils(raw: string): { value: number } | { error: string } {
  const s = raw.trim();
  if (s === "") return { error: "Please enter your current sigils." };
  if (!/^\d+$/.test(s)) return { error: "Enter a non-negative whole number only." };
  const n = Number(s);
  if (!Number.isSafeInteger(n)) return { error: "That number is too large." };
  return { value: n };
}

export type SigilStatus = "MYTHIC UNLOCKED" | "ON TRACK" | "NOT ON TRACK";

export const STATUS_LABEL: Record<SigilStatus, string> = {
  "MYTHIC UNLOCKED": "MYTHIC UNLOCKED",
  "ON TRACK": "AABOT",
  "NOT ON TRACK": "HINDI ABOT PAR",
};

export function calcSigils(current: number, nowMs: number, deadlineMs = EVENT_DEADLINE_MS) {
  const remaining = Math.max(0, TARGET_SIGILS - current);
  const weeksRequired = current < TARGET_SIGILS ? Math.ceil(remaining / WEEKLY_SIGILS) : 0;
  const projected = current + weeksRequired * WEEKLY_SIGILS;
  const projectedAtMs = nowMs + weeksRequired * WEEK_MS;
  const opportunities = Math.max(0, Math.floor((deadlineMs - nowMs) / WEEK_MS));
  const deadlineProjection = current + opportunities * WEEKLY_SIGILS;
  const status =
    current >= TARGET_SIGILS
      ? "MYTHIC UNLOCKED"
      : opportunities >= weeksRequired
        ? "ON TRACK"
        : "NOT ON TRACK";
  return { current, remaining, weeksRequired, projected, projectedAtMs, opportunities, deadlineProjection, status } as const;
}
