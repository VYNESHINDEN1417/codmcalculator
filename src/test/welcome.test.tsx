import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Welcome } from "@/components/welcome";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("welcome entry rules", () => {
  it("withholds dismissal for five seconds, including Escape", () => {
    vi.useFakeTimers();
    render(<Welcome />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.queryByRole("button", { name: "OKAY" })).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button", { name: "OKAY" })).toBeVisible();
  });

  it("copies the exact numeric CODM UID", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Welcome />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /CODM UID/ })));
    expect(writeText).toHaveBeenCalledWith("6957634743378640897");
  });

  it("starts looping audio only after OKAY", async () => {
    vi.useFakeTimers();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const { container } = render(<Welcome />);
    expect(play).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(5000));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "OKAY" })));
    expect(play).toHaveBeenCalledTimes(1);
    expect(container.querySelector("audio")?.loop).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mutes and unmutes music without restarting or pausing playback", async () => {
    vi.useFakeTimers();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { container } = render(<Welcome />);
    act(() => vi.advanceTimersByTime(5000));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "OKAY" })));
    fireEvent.click(screen.getByRole("button", { name: "Mute music" }));
    expect(container.querySelector("audio")?.muted).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Unmute music" }));
    expect(container.querySelector("audio")?.muted).toBe(false);
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();
  });
});