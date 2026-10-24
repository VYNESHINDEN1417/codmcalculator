import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Index } from "@/routes/index";
import { calcSigils } from "@/lib/sigils";
import { remainingTaskWeeks, SIGIL_TASKS, taskReward, WEEK_MS } from "@/lib/sigil-tasks";
import { EVENT_DEADLINE_MS } from "@/lib/ph-time";

afterEach(() => { cleanup(); vi.useRealTimers(); });

function enterTasks() {
  fireEvent.click(screen.getByRole("button", { name: /SIGIL TASKS/ }));
  act(() => vi.advanceTimersByTime(20000));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "OKAY" }));
}

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

  it("falls back to the weekly grind when no tasks are selected, since tasks are optional", () => {
    const startsAtMs = EVENT_DEADLINE_MS - 2 * WEEK_MS;
    expect(calcSigils(450, startsAtMs, undefined, false, { startsAtMs, selections: [[], []] })).toMatchObject({ deadlineProjection: 566, status: "ON TRACK" });
  });

  it("withholds checkboxes for 20 seconds and prevents canceling the task flow", () => {
    vi.useFakeTimers();
    vi.setSystemTime(EVENT_DEADLINE_MS - 2 * WEEK_MS);
    render(<Index />);
    fireEvent.click(screen.getByRole("button", { name: /SIGIL TASKS/ }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    act(() => vi.advanceTimersByTime(19999));
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "OKAY" })).toBeNull();
    expect(within(screen.getByRole("dialog")).queryAllByRole("checkbox")).toHaveLength(0);
    act(() => vi.advanceTimersByTime(1));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "OKAY" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "OKAY" })).toBeNull();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "NEXT" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "OKAY" }));
    expect(screen.queryByRole("dialog")).toBeNull();
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
    enterTasks();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "OKAY" })).toBeNull();
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Play Matches for a total of 400 minutes" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 498")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "NEXT" }));
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Log in daily" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 505")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "OKAY" }));
    enterTasks();
    const reopened = screen.getByRole("dialog");
    expect(within(reopened).getByRole("checkbox", { name: "Play Matches for a total of 400 minutes" })).toBeChecked();
    fireEvent.click(within(reopened).getByRole("checkbox", { name: "Play Matches for a total of 400 minutes" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 497")).toBeTruthy();
  });

  it("copies a week's selections and pastes them into each subsequent week without sharing edits", () => {
    vi.useFakeTimers();
    vi.setSystemTime(EVENT_DEADLINE_MS - 3 * WEEK_MS);
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "490" } });
    enterTasks();
    const dialog = within(screen.getByRole("dialog"));
    const task = () => dialog.getByRole("checkbox", { name: "Play Matches for a total of 400 minutes" });
    fireEvent.click(task());
    fireEvent.click(dialog.getByRole("button", { name: "COPY" }));
    fireEvent.click(dialog.getByRole("button", { name: "NEXT" }));
    expect(task()).not.toBeChecked();
    fireEvent.click(dialog.getByRole("button", { name: "PASTE" }));
    expect(task()).toBeChecked();
    expect(screen.getByText("SIGILS MO SA DEC 10: 506")).toBeTruthy();
    fireEvent.click(task());
    fireEvent.click(dialog.getByRole("button", { name: "NEXT" }));
    fireEvent.click(dialog.getByRole("button", { name: "PASTE" }));
    expect(task()).toBeChecked();
    expect(screen.getByText("SIGILS MO SA DEC 10: 506")).toBeTruthy();
    fireEvent.click(dialog.getByRole("button", { name: "OKAY" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});