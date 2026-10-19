import { EVENT_DEADLINE_MS } from "./ph-time";

export const TARGET_SIGILS = 500;
export const WEEKLY_SIGILS = 52;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function parseSigils(raw: string): { value: number } | { error: string } {
  const s = raw.trim();
  if (s === "") return { error: "Please enter your current sigils." };
  if (!/^\d+$/.test(s)) return { error: "Enter a non-negative whole number only." };
  const n = Number(s);
  if (!Number.isSafeInteger(n)) return { error: "That number is too large." };
  return { value: n };
}

export function calcSigils(current: number, nowMs: number, deadlineMs = EVENT_DEADLINE_MS) {
  const remaining = Math.max(0, TARGET_SIGILS - current);
  const weeksRequired = current < TARGET_SIGILS ? Math.ceil(remaining / WEEKLY_SIGILS) : 0;
  const projected = current + weeksRequired * WEEKLY_SIGILS;
  const opportunities = Math.max(0, Math.floor((deadlineMs - nowMs) / WEEK_MS));
  const status =
    current >= TARGET_SIGILS
      ? "MYTHIC UNLOCKED"
      : opportunities >= weeksRequired
        ? "ON TRACK"
        : "NOT ON TRACK";
  return { current, remaining, weeksRequired, projected, opportunities, status } as const;
}
