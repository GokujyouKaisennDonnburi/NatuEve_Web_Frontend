import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventDetailErrorPage from "@/app/(main)/event/[id]/error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EventDetailErrorPage", () => {
  it("再読み込みボタンで retry を呼ぶ", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();

    render(<EventDetailErrorPage error={new Error("failed")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
