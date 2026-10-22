import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Index } from "@/routes/index";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("calculator warning lifecycle", () => {
  it("uses the 50-sigil booster selected before calculation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "450" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "50 SIGIL BOOSTER" }));
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.getByText("500 / 500 · 0 to go")).toBeTruthy();
    expect(screen.getByLabelText("CURRENT SIGILS")).toHaveValue("450");
  });

  it("recalculates after submission without accumulating the booster", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.getByText("90 / 500 · 410 to go")).toBeTruthy();
    expect(screen.queryByRole("alert")).not.toBeNull();
    const booster = screen.getByRole("checkbox", { name: "50 SIGIL BOOSTER" });
    fireEvent.click(booster);
    expect(screen.getByText("140 / 500 · 360 to go")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.getByText("140 / 500 · 360 to go")).toBeTruthy();
    fireEvent.click(booster);
    expect(screen.getByText("90 / 500 · 410 to go")).toBeTruthy();
    expect(screen.queryByRole("alert")).not.toBeNull();
  });
  it("warns for an unreachable 0-sigil result and persists across weapon changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.queryByRole("alert")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show STATIC-HV CORE OF FIRE" }));
    expect(screen.queryByRole("alert")).not.toBeNull();
  });

  it("clears the warning as soon as the current count changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    const input = screen.getByLabelText("CURRENT SIGILS");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.queryByRole("alert")).not.toBeNull();
    fireEvent.change(input, { target: { value: "260" } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("replaces the weeks headline with the projected sigils at the deadline when unreachable", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.getByText("406 lang ang aabutin ng sigil mo sa Deadline")).toBeTruthy();
    expect(screen.queryByText(/WEEKS LEFT TO GRIND/)).toBeNull();
  });

  it("keeps the weeks headline when the goal is still reachable", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "450" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.getByText("1 WEEK LEFT TO GRIND")).toBeTruthy();
    expect(screen.getByText("500 sigils ka na sa 4th week of October")).toBeTruthy();
  });

  it("shows no 500-sigil projection line when unreachable or already unlocked", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.queryByText(/500 sigils ka na sa/)).toBeNull();
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "600" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.queryByText(/500 sigils ka na sa/)).toBeNull();
  });

  it("projects sigils reached by the December 10 deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CALCULATE" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 406")).toBeTruthy();
    expect(screen.queryByText(/Projection kung kailan/)).toBeNull();
  });
});