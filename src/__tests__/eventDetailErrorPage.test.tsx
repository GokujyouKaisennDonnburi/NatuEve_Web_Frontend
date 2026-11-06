import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventDetailErrorPage from "@/app/(main)/event/[id]/error";
import { APP_NAME } from "@/constants/config";
import { PAGE_TITLES } from "@/constants/pageTitles";

beforeEach(() => {
  document.title = "";
});

afterEach(() => {
  vi.restoreAllMocks();
  document.title = "";
});

describe("EventDetailErrorPage", () => {
  it("再読み込みボタンで retry を呼ぶ", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();

    render(<EventDetailErrorPage error={new Error("failed")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("タブタイトルを設定する", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <EventDetailErrorPage error={new Error("failed")} retry={vi.fn()} />,
    );

    expect(document.title).toBe(
      `${PAGE_TITLES.EVENT_DETAIL_ERROR} | ${APP_NAME}`,
    );
  });
});
