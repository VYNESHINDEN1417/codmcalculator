import { describe, it, expect } from "vitest";
import { acquisitionPhrase, acquisitionWeek, calcSigils, parseSigils, STATUS_LABEL } from "@/lib/sigils";
import { EVENT_DEADLINE_MS } from "@/lib/ph-time";

const now = Date.parse("2026-10-19T22:00:00Z");

describe("sigil calculator", () => {
  it("adds exactly 50 sigils when the booster is enabled", () => {
    expect(calcSigils(260, now, undefined, true)).toMatchObject({ current: 310, remaining: 190, weeksRequired: 4, projected: 518, deadlineProjection: 674 });
    expect(calcSigils(260, now, undefined, false).current).toBe(260);
  });
  it("A: 260", () => expect(calcSigils(260, now)).toMatchObject({ remaining: 240, weeksRequired: 5, projected: 520 }));
  it("B: 310", () => expect(calcSigils(310, now)).toMatchObject({ remaining: 190, weeksRequired: 4, projected: 518 }));
  it("C: 450", () => expect(calcSigils(450, now)).toMatchObject({ remaining: 50, weeksRequired: 1, projected: 502 }));
  it("D: 500", () => expect(calcSigils(500, now)).toMatchObject({ remaining: 0, weeksRequired: 0, status: "MYTHIC UNLOCKED" }));
  it("E: 0", () => expect(calcSigils(0, now)).toMatchObject({ remaining: 500, weeksRequired: 10, projected: 520 }));
  it("not on track after deadline", () => expect(calcSigils(260, EVENT_DEADLINE_MS + 1).status).toBe("NOT ON TRACK"));
  it("on track with 7 weeks left", () => expect(calcSigils(260, now).status).toBe("ON TRACK"));
  it("shows Tagalog status labels", () => {
    expect(STATUS_LABEL["ON TRACK"]).toBe("AABOT");
    expect(STATUS_LABEL["NOT ON TRACK"]).toBe("HINDI ABOT PAR");
    expect(STATUS_LABEL["MYTHIC UNLOCKED"]).toBe("MYTHIC UNLOCKED");
  });
  it("projects acquisition after five weekly grinds for 260 sigils", () => {
    const result = calcSigils(260, now);
    expect(result.projectedAtMs).toBe(Date.parse("2026-11-23T22:00:00Z"));
    expect(acquisitionWeek(result.projectedAtMs)).toEqual({ week: 4, month: "November", year: 2026 });
    expect(acquisitionPhrase(result.projectedAtMs)).toBe("500 sigils ka na sa 4th week of November");
  });
  it("projects ten weeks for zero sigils, beyond the deadline", () => {
    const result = calcSigils(0, now);
    expect(result.projectedAtMs).toBe(Date.parse("2026-12-28T22:00:00Z"));
    expect(result.projectedAtMs).toBeGreaterThan(EVENT_DEADLINE_MS);
  });
  it("estimates sigils reached by the deadline from the weekly grinds still available", () => {
    expect(calcSigils(0, now).opportunities).toBe(7);
    expect(calcSigils(0, now).deadlineProjection).toBe(364);
    expect(calcSigils(440, now).deadlineProjection).toBe(804);
  });
  it("does not add grinding time when mythic is already unlocked", () => {
    expect(calcSigils(500, now).projectedAtMs).toBe(now);
  });
  it("uses the Philippine day for acquisition week and month boundaries", () => {
    expect(acquisitionWeek(Date.parse("2026-10-31T16:00:00Z"))).toEqual({ week: 1, month: "November", year: 2026 });
  });
  it("validation", () => {
    expect(parseSigils("")).toHaveProperty("error");
    expect(parseSigils("-5")).toHaveProperty("error");
    expect(parseSigils("2.5")).toHaveProperty("error");
    expect(parseSigils("abc")).toHaveProperty("error");
    expect(parseSigils("0")).toEqual({ value: 0 });
    expect(parseSigils("600")).toEqual({ value: 600 });
  });
});
