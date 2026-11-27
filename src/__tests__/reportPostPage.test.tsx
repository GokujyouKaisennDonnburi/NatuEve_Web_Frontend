import { render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildEventDetail } from "@/__tests__/fixtures/event";
import ReportPostPage from "@/app/(main)/report-post/page";
import { EventDetailError } from "@/lib/errors";
import { getEventDetail } from "@/services/event";

const EVENT_ID = "00000000-0000-4000-8000-000000000002";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams({ eventId: EVENT_ID }),
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
vi.mock("@/components/layouts/AuthProvider", () => ({
  useAuthContext: () => ({ isAuthenticated: true, isSessionLoading: false }),
}));
vi.mock("@/services/event", () => ({
  getEventDetail: vi.fn(),
}));
vi.mock("@/services/report", () => ({
  createReport: vi.fn(),
}));
vi.mock("@/services/upload", () => ({
  uploadFile: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockGetEventDetail = vi.mocked(getEventDetail);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReportPostPage", () => {
  it("対象イベントを表示する", async () => {
    mockGetEventDetail.mockResolvedValue(
      buildEventDetail({ id: EVENT_ID, title: "テストイベント" }),
    );

    render(<ReportPostPage />);

    expect(await screen.findByText("テストイベント")).toBeInTheDocument();
    expect(screen.queryByText("このイベントは削除されました。")).toBeNull();
  });

  // 取りやめ済みのイベントはエラー扱いにせず、削除されたことを表示する（ADR-0008）。
  it("対象イベントが取りやめ済み（410）の場合は削除の表示にし、エラーの toast を出さない", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetEventDetail.mockRejectedValue(
      new EventDetailError("イベントは削除されました", 410),
    );

    render(<ReportPostPage />);

    expect(
      await screen.findByText("このイベントは削除されました。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /投稿/ })).toBeNull();
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/event-list");
    }
    expect(toast.error).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("410 以外の取得失敗はエラーの toast を出す", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetEventDetail.mockRejectedValue(new EventDetailError("failed", 500));

    render(<ReportPostPage />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "イベント情報の取得に失敗しました",
      ),
    );
    expect(screen.queryByText("このイベントは削除されました。")).toBeNull();
  });
});
