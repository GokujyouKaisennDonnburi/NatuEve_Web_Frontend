import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildEventDetail } from "@/__tests__/fixtures/event";
import { EventDetailContent } from "@/components/organisms/EventDetailContent";
import { APP_NAME } from "@/constants/config";
import { PAGE_TITLES } from "@/constants/pageTitles";
import { EventDetailError } from "@/lib/errors";
import { getEventDetail } from "@/services/event";
import { getReport } from "@/services/report";

vi.mock("@/services/event", () => ({
  getEventDetail: vi.fn(),
}));
vi.mock("@/services/report", () => ({
  getReport: vi.fn(),
}));
// 詳細の本体は依存が多いため、タイトルと再取得の操作だけを持つスタブにする。
vi.mock("@/components/organisms/EventDetail", () => ({
  EventDetail: ({
    event,
    onEventRefetch,
  }: {
    event: { title: string };
    onEventRefetch: () => void;
  }) => (
    <div>
      <h1>{event.title}</h1>
      <button type="button" onClick={onEventRefetch}>
        再取得
      </button>
    </div>
  ),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: ReactNode } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockGetEventDetail = vi.mocked(getEventDetail);
const mockGetReport = vi.mocked(getReport);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetReport.mockResolvedValue(null);
  document.title = "";
});

afterEach(() => {
  document.title = "";
});

describe("EventDetailContent", () => {
  it("取りやめられていなければイベントの詳細を表示する", () => {
    render(
      <EventDetailContent
        initialEvent={buildEventDetail({ title: "テストイベント" })}
        initialNow={Date.now()}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "テストイベント" }),
    ).toBeInTheDocument();
  });

  // 開いたまま取りやめられたら、古い内容の代わりに削除の表示を出す（ADR-0008）。
  it("再取得で 410 を受けたら、詳細の代わりに削除の表示を h1 で出し、見出しへフォーカスを移す", async () => {
    mockGetEventDetail.mockRejectedValue(
      new EventDetailError("イベントは削除されました", 410),
    );

    render(
      <EventDetailContent
        initialEvent={buildEventDetail({ title: "テストイベント" })}
        initialNow={Date.now()}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "再取得" }));
    });

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "このイベントは削除されました。",
    });
    expect(screen.queryByText("テストイベント")).toBeNull();
    expect(heading).toHaveFocus();
    expect(document.title).toBe(
      `${PAGE_TITLES.EVENT_DETAIL_GONE} | ${APP_NAME}`,
    );
    expect(
      screen.getByRole("link", { name: "イベント一覧にもどる" }),
    ).toHaveAttribute("href", "/event-list");
  });
});
