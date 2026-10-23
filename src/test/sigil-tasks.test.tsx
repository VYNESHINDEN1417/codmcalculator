import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Index } from "@/routes/index";
import { calcSigils } from "@/lib/sigils";
import { remainingTaskWeeks, SIGIL_TASKS, taskReward, WEEK_MS } from "@/lib/sigil-tasks";
import { EVENT_DEADLINE_MS } from "@/lib/ph-time";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("weekly task rules", () => {
  it("uses every supplied reward, totaling 58 for all 15 tasks", () => {
    expect(SIGIL_TASKS.map((task) => task.sigils)).toEqual([8, 2, 2, 2, 2, 3, 5, 5, 5, 5, 5, 2, 2, 3, 7]);
    expect(taskReward(SIGIL_TASKS.map((_, index) => index))).toBe(58);
    expect(taskReward([0, 0, 14])).toBe(15);
  });

  it("only allows complete seven-day opportunities before the deadline", () => {
    expect(remainingTaskWeeks(EVENT_DEADLINE_MS - 2 * WEEK_MS)).toBe(2);
    expect(remainingTaskWeeks(EVENT_DEADLINE_MS - 2 * WEEK_MS + 1)).toBe(1);
    expect(remainingTaskWeeks(EVENT_DEADLINE_MS + 1)).toBe(0);
  });

  it("adds chosen rewards per week, finds the acquisition week, and adds the booster once", () => {
    const startsAtMs = EVENT_DEADLINE_MS - 3 * WEEK_MS;
    const plan = { startsAtMs, selections: [[0], [14], [1]] };
    expect(calcSigils(490, startsAtMs, undefined, false, plan)).toMatchObject({ deadlineProjection: 507, projected: 505, weeksRequired: 2, projectedAtMs: startsAtMs + 2 * WEEK_MS, status: "ON TRACK" });
    expect(calcSigils(440, startsAtMs, undefined, true, plan).deadlineProjection).toBe(507);
    expect(calcSigils(440, startsAtMs, undefined, false, plan).status).toBe("NOT ON TRACK");
  });

  it("does not fall back to 58 when weeks have no selected tasks", () => {
    const startsAtMs = EVENT_DEADLINE_MS - 2 * WEEK_MS;
    expect(calcSigils(450, startsAtMs, undefined, false, { startsAtMs, selections: [[], []] })).toMatchObject({ deadlineProjection: 450, status: "NOT ON TRACK" });
  });

  it("ignores expired task weeks and rewards after the deadline", () => {
    const startsAtMs = EVENT_DEADLINE_MS - 2 * WEEK_MS;
    const plan = { startsAtMs, selections: [[0], [14], [0]] };
    expect(calcSigils(100, startsAtMs + WEEK_MS, undefined, false, plan).deadlineProjection).toBe(107);
  });

  it("requires all weeks before OKAY and recalculates editable checkboxes without CALCULATE", () => {
    vi.useFakeTimers();
    vi.setSystemTime(EVENT_DEADLINE_MS - 2 * WEEK_MS);
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "490" } });
    fireEvent.click(screen.getByRole("button", { name: "SIGIL TASKS" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "OKAY" })).toBeNull();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Play Matches for a total of 400 minutes" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 498")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "NEXT" }));
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Log in daily" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 505")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "OKAY" }));
    fireEvent.click(screen.getByRole("button", { name: /SIGIL TASKS/ }));
    const reopened = screen.getByRole("dialog");
    expect(within(reopened).getByRole("checkbox", { name: "Play Matches for a total of 400 minutes" })).toBeChecked();
    fireEvent.click(within(reopened).getByRole("checkbox", { name: "Play Matches for a total of 400 minutes" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 497")).toBeTruthy();
  });
});