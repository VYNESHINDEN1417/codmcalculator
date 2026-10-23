import { EVENT_DEADLINE_MS } from "./ph-time";

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const SIGIL_TASKS = [
  { name: "Play Matches for a total of 400 minutes", sigils: 8 },
  { name: "Play 1 Match in any mode", sigils: 2 },
  { name: "Play 3 Matches in any mode", sigils: 2 },
  { name: "Play 1 Match in Honkai: Gleaming Front", sigils: 2 },
  { name: "3 Matches in Honkai: Gleaming Front", sigils: 2 },
  { name: "Play 5 Matches in any mode", sigils: 3 },
  { name: "Play 10 Matches in any mode", sigils: 5 },
  { name: "Play 20 Matches in any mode", sigils: 5 },
  { name: "Play 30 Matches in any mode", sigils: 5 },
  { name: "Play 40 Matches in any mode", sigils: 5 },
  { name: "Play 50 Matches in any mode", sigils: 5 },
  { name: "Play 1 Match with friends", sigils: 2 },
  { name: "Play 3 Matches with friends", sigils: 2 },
  { name: "Play 5 Matches with friends", sigils: 3 },
  { name: "Log in daily", sigils: 7 },
] as const;

export type TaskPlan = { startsAtMs: number; selections: number[][] };

export function remainingTaskWeeks(nowMs: number, deadlineMs = EVENT_DEADLINE_MS) {
  return Math.max(0, Math.floor((deadlineMs - nowMs) / WEEK_MS));
}

export function taskReward(selection: number[]) {
  return [...new Set(selection)].reduce((total, index) => total + (SIGIL_TASKS[index]?.sigils ?? 0), 0);
}

export function taskWeekLabel(startsAtMs: number, index: number) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric" });
  return `${formatter.format(startsAtMs + index * WEEK_MS)} – ${formatter.format(startsAtMs + (index + 1) * WEEK_MS)}`;
}