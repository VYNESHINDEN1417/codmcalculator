// Fixed event deadline: Dec 10, 2026 08:00 AM Philippine time (UTC+8).
export const EVENT_DEADLINE_MS = Date.parse("2026-12-10T08:00:00+08:00");

export function formatManila(now: Date) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
    .format(now)
    .toUpperCase();
  return { time, date };
}

export function countdownParts(nowMs: number, deadlineMs = EVENT_DEADLINE_MS) {
  const diff = Math.max(0, deadlineMs - nowMs);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    ended: diff === 0,
  };
}
