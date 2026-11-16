import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildEventDetail } from "@/__tests__/fixtures/event";
import { EventJoinConfirmContent } from "@/components/organisms/EventJoinConfirmContent";
import { useEventJoinConfirm } from "@/hooks/useEventJoinConfirm";
import { getEventDetail } from "@/services/event";
import { confirmEventJoin, getEventJoinPreview } from "@/services/participate";
import { ConfirmJoinError, ConfirmJoinErrorCode } from "@/types/participate";

vi.mock("@/services/event", () => ({
  getEventDetail: vi.fn(),
}));
vi.mock("@/services/participate", () => ({
  confirmEventJoin: vi.fn(),
  getEventJoinPreview: vi.fn(),
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
const mockConfirmEventJoin = vi.mocked(confirmEventJoin);
const mockGetEventJoinPreview = vi.mocked(getEventJoinPreview);

const EVENT_ID = "00000000-0000-4000-8000-000000000002";
const TOKEN = "confirm-token-1";

const renderContent = (token: string = TOKEN) =>
  render(<EventJoinConfirmContent eventId={EVENT_ID} token={token} />);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetEventDetail.mockResolvedValue(
    buildEventDetail({ id: EVENT_ID, title: "テストイベント" }),
  );
  mockGetEventJoinPreview.mockResolvedValue({
    participants: [
      { category: "大人", headCount: 2 },
      { category: "子ども", headCount: 1 },
    ],
    partySize: 3,
  });
});

describe("EventJoinConfirmContent", () => {
  it("イベント情報と確定ボタンを表示する", async () => {
    renderContent();

    expect(await screen.findByText("テストイベント")).toBeInTheDocument();
    expect(screen.getByText("申込先のイベント")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "申込を確定する" }),
    ).toBeInTheDocument();
  });

  it("確定ボタンを押す前に申込内容を表示する", async () => {
    renderContent();

    expect(await screen.findByText("申込内容")).toBeInTheDocument();
    expect(screen.getByText("大人")).toBeInTheDocument();
    expect(screen.getByText("子ども")).toBeInTheDocument();
    expect(screen.getByText("2名")).toBeInTheDocument();
    expect(screen.getByText("1名")).toBeInTheDocument();
    expect(screen.getByText("合計")).toBeInTheDocument();
    expect(screen.getByText("3名")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "申込を確定する" }),
    ).toBeInTheDocument();
    expect(mockConfirmEventJoin).not.toHaveBeenCalled();
  });

  it("プレビューが取得できない場合は確定前に申込内容を表示しない", async () => {
    mockGetEventJoinPreview.mockRejectedValue(
      new ConfirmJoinError(
        ConfirmJoinErrorCode.InvalidRequest,
        "確認リンクが無効です",
        400,
      ),
    );
    mockConfirmEventJoin.mockResolvedValue({
      eventId: EVENT_ID,
      confirmedAt: "2026-11-13T00:00:00Z",
      participants: [{ category: "大人", headCount: 2 }],
      partySize: 2,
    });

    renderContent();

    const button = await screen.findByRole("button", {
      name: "申込を確定する",
    });
    expect(screen.queryByText("申込内容")).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(await screen.findByText("申込が確定しました")).toBeInTheDocument();
    expect(screen.getByText("申込内容")).toBeInTheDocument();
  });

  it("確定に成功すると「申込が確定しました」と申込内容を表示する", async () => {
    mockConfirmEventJoin.mockResolvedValue({
      eventId: EVENT_ID,
      confirmedAt: "2026-11-13T00:00:00Z",
      participants: [
        { category: "大人", headCount: 2 },
        { category: "子ども", headCount: 1 },
      ],
      partySize: 3,
    });

    renderContent();

    fireEvent.click(
      await screen.findByRole("button", { name: "申込を確定する" }),
    );

    expect(await screen.findByText("申込が確定しました")).toBeInTheDocument();
    expect(screen.getByText("申込内容")).toBeInTheDocument();
    expect(screen.getByText("大人")).toBeInTheDocument();
    expect(screen.getByText("2名")).toBeInTheDocument();
    expect(screen.getByText("子ども")).toBeInTheDocument();
    expect(screen.getByText("1名")).toBeInTheDocument();
    expect(screen.getByText("合計")).toBeInTheDocument();
    expect(screen.getByText("3名")).toBeInTheDocument();
    expect(mockConfirmEventJoin).toHaveBeenCalledWith(EVENT_ID, TOKEN);
  });

  it("二重クリックでも確定APIは1回しか呼ばない", async () => {
    mockConfirmEventJoin.mockImplementation(() => new Promise(() => {}));

    renderContent();

    const button = await screen.findByRole("button", {
      name: "申込を確定する",
    });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockConfirmEventJoin).toHaveBeenCalledTimes(1);
  });

  it("無効・期限切れのトークンでは確定できなかったことを表示する", async () => {
    mockConfirmEventJoin.mockRejectedValue(
      new ConfirmJoinError(
        ConfirmJoinErrorCode.InvalidRequest,
        "確認リンクが無効か、有効期限が切れています",
        400,
      ),
    );

    renderContent();

    fireEvent.click(
      await screen.findByRole("button", { name: "申込を確定する" }),
    );

    expect(
      await screen.findByText("申込を確定できませんでした"),
    ).toBeInTheDocument();
    expect(screen.getByText(/有効期限が切れています/)).toBeInTheDocument();
  });

  it("定員に達している場合は確定できないことを表示する", async () => {
    mockConfirmEventJoin.mockRejectedValue(
      new ConfirmJoinError(
        ConfirmJoinErrorCode.CapacityFull,
        "定員に達しています",
        409,
      ),
    );

    renderContent();

    fireEvent.click(
      await screen.findByRole("button", { name: "申込を確定する" }),
    );

    expect(
      await screen.findByText("申込を確定できませんでした"),
    ).toBeInTheDocument();
    expect(screen.getByText(/定員に達しているため/)).toBeInTheDocument();
  });

  it("再試行できるエラーでは「もう一度確定する」で再実行できる", async () => {
    mockConfirmEventJoin
      .mockRejectedValueOnce(
        new ConfirmJoinError(
          ConfirmJoinErrorCode.CapacityFull,
          "定員に達しています",
          409,
        ),
      )
      .mockResolvedValueOnce({
        eventId: EVENT_ID,
        confirmedAt: "2026-11-13T00:00:00Z",
        participants: [{ category: "大人", headCount: 1 }],
        partySize: 1,
      });

    renderContent();

    fireEvent.click(
      await screen.findByRole("button", { name: "申込を確定する" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "もう一度確定する" }),
    );

    expect(await screen.findByText("申込が確定しました")).toBeInTheDocument();
    expect(mockConfirmEventJoin).toHaveBeenCalledTimes(2);
    expect(mockConfirmEventJoin).toHaveBeenLastCalledWith(EVENT_ID, TOKEN);
  });

  it("通信エラーでも再試行ボタンを表示する", async () => {
    mockConfirmEventJoin.mockRejectedValue(new Error("network error"));

    renderContent();

    fireEvent.click(
      await screen.findByRole("button", { name: "申込を確定する" }),
    );

    expect(
      await screen.findByRole("button", { name: "もう一度確定する" }),
    ).toBeInTheDocument();
  });

  it("無効・期限切れのトークンでは再試行ボタンを表示しない", async () => {
    mockConfirmEventJoin.mockRejectedValue(
      new ConfirmJoinError(
        ConfirmJoinErrorCode.InvalidRequest,
        "確認リンクが無効か、有効期限が切れています",
        400,
      ),
    );

    renderContent();

    fireEvent.click(
      await screen.findByRole("button", { name: "申込を確定する" }),
    );

    expect(
      await screen.findByText("申込を確定できませんでした"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "もう一度確定する" }),
    ).not.toBeInTheDocument();
  });

  it("トークンが無い場合はAPIを呼ばずにエラー表示にする", async () => {
    renderContent("");

    expect(await screen.findByText("テストイベント")).toBeInTheDocument();
    expect(screen.getByText("申込を確定できませんでした")).toBeInTheDocument();
    expect(
      screen.getByText(/確認リンクが正しくありません/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "申込を確定する" }),
    ).not.toBeInTheDocument();
    expect(mockConfirmEventJoin).not.toHaveBeenCalled();
  });
});

describe("useEventJoinConfirm", () => {
  it("確定成功後にconfirmを呼んでも確定APIは再実行しない", async () => {
    mockConfirmEventJoin.mockResolvedValue({
      eventId: EVENT_ID,
      confirmedAt: "2026-11-13T00:00:00Z",
      participants: [{ category: "大人", headCount: 1 }],
      partySize: 1,
    });

    const { result } = renderHook(() =>
      useEventJoinConfirm({ eventId: EVENT_ID, token: TOKEN }),
    );

    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => {
      result.current.confirm();
    });

    expect(mockConfirmEventJoin).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("success");
  });

  it("確定失敗から再試行で成功すると再試行できない状態に戻る", async () => {
    mockConfirmEventJoin
      .mockRejectedValueOnce(
        new ConfirmJoinError(
          ConfirmJoinErrorCode.CapacityFull,
          "定員に達しています",
          409,
        ),
      )
      .mockResolvedValueOnce({
        eventId: EVENT_ID,
        confirmedAt: "2026-11-13T00:00:00Z",
        participants: [{ category: "大人", headCount: 1 }],
        partySize: 1,
      });

    const { result } = renderHook(() =>
      useEventJoinConfirm({ eventId: EVENT_ID, token: TOKEN }),
    );

    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.canRetry).toBe(true);
    });

    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.canRetry).toBe(false);
  });
});
