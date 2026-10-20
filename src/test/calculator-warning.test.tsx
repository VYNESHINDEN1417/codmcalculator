import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Index } from "@/routes/index";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("calculator warning lifecycle", () => {
  it("warns for an unreachable 0-sigil result and persists across weapon changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CONVERT" }));
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
    fireEvent.click(screen.getByRole("button", { name: "CONVERT" }));
    expect(screen.queryByRole("alert")).not.toBeNull();
    fireEvent.change(input, { target: { value: "260" } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "CONVERT" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("replaces the weeks headline with the projected sigils at the deadline when unreachable", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CONVERT" }));
    expect(screen.getByText("364 lang ang aabutin ng sigil mo sa Deadline")).toBeTruthy();
    expect(screen.queryByText(/WEEKS LEFT TO GRIND/)).toBeNull();
  });

  it("keeps the weeks headline when the goal is still reachable", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "450" } });
    fireEvent.click(screen.getByRole("button", { name: "CONVERT" }));
    expect(screen.getByText("1 WEEK LEFT TO GRIND")).toBeTruthy();
  });

  it("projects sigils reached by the December 10 deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T22:26:00Z"));
    render(<Index />);
    fireEvent.change(screen.getByLabelText("CURRENT SIGILS"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "CONVERT" }));
    expect(screen.getByText("SIGILS MO SA DEC 10: 364")).toBeTruthy();
    expect(screen.queryByText(/Projection kung kailan/)).toBeNull();
  });
});