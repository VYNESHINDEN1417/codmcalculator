import { describe, it, expect } from "vitest";
import { calcSigils, parseSigils } from "@/lib/sigils";
import { EVENT_DEADLINE_MS } from "@/lib/ph-time";

const now = Date.parse("2026-10-19T22:00:00Z");

describe("sigil calculator", () => {
  it("A: 260", () => expect(calcSigils(260, now)).toMatchObject({ remaining: 240, weeksRequired: 5, projected: 520 }));
  it("B: 310", () => expect(calcSigils(310, now)).toMatchObject({ remaining: 190, weeksRequired: 4, projected: 518 }));
  it("C: 450", () => expect(calcSigils(450, now)).toMatchObject({ remaining: 50, weeksRequired: 1, projected: 502 }));
  it("D: 500", () => expect(calcSigils(500, now)).toMatchObject({ remaining: 0, weeksRequired: 0, status: "MYTHIC UNLOCKED" }));
  it("E: 0", () => expect(calcSigils(0, now)).toMatchObject({ remaining: 500, weeksRequired: 10, projected: 520 }));
  it("not on track after deadline", () => expect(calcSigils(260, EVENT_DEADLINE_MS + 1).status).toBe("NOT ON TRACK"));
  it("on track with 7 weeks left", () => expect(calcSigils(260, now).status).toBe("ON TRACK"));
  it("validation", () => {
    expect(parseSigils("")).toHaveProperty("error");
    expect(parseSigils("-5")).toHaveProperty("error");
    expect(parseSigils("2.5")).toHaveProperty("error");
    expect(parseSigils("abc")).toHaveProperty("error");
    expect(parseSigils("0")).toEqual({ value: 0 });
    expect(parseSigils("600")).toEqual({ value: 600 });
  });
});
