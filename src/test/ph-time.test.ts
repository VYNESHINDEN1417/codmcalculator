import { describe, it, expect } from "vitest";
import { formatManila, countdownParts, EVENT_DEADLINE_MS } from "@/lib/ph-time";

describe("ph-time", () => {
  it("shows Manila time regardless of UTC", () => {
    const r = formatManila(new Date("2026-10-19T21:39:00Z"));
    expect(r.time).toBe("05:39:00 AM");
    expect(r.date).toBe("OCTOBER 20, 2026");
  });
  it("deadline is Dec 10 2026 08:00 PHT", () => {
    expect(EVENT_DEADLINE_MS).toBe(Date.parse("2026-12-10T00:00:00Z"));
  });
  it("countdown hits zero at deadline", () => {
    expect(countdownParts(EVENT_DEADLINE_MS).ended).toBe(true);
    expect(countdownParts(EVENT_DEADLINE_MS - 86400000).days).toBe(1);
  });
});
