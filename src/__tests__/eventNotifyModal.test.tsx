import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getResponse } from "msw";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventNotifyModal } from "@/components/molecules/event-detail/EventNotifyModal";
import { mockEvents } from "@/mocks/handlers/events/data";
import { eventNotificationHandler } from "@/mocks/handlers/events/notifications";
import { apiFetch } from "@/services/apiClient";
import { notifyEventParticipants } from "@/services/event";
import { MOCK_AUTH_SESSION } from "@/services/mockAuth";

vi.mock("@/services/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const draft = { subject: "集合場所", body: "駅前に集合してください。" };

function useMockNotificationApi() {
  vi.mocked(apiFetch).mockImplementation(async (path, init) => {
    const request = new Request(
      new URL(String(path), window.location.href),
      init,
    );
    request.headers.set("Authorization", `Bearer ${MOCK_AUTH_SESSION.token}`);
    const response = await getResponse([eventNotificationHandler], request);
    if (!response) throw new Error("全体連絡のリクエストに一致しません");
    return response;
  });
}

function submitFromModal(eventId: string) {
  const onOpenChange = vi.fn();
  const { unmount } = render(
    <EventNotifyModal
      isOpen
      onOpenChange={onOpenChange}
      eventId={eventId}
      totalCount={1}
      totalMembers={1}
    />,
  );
  fireEvent.change(screen.getByLabelText("件名"), {
    target: { value: draft.subject },
  });
  fireEvent.change(screen.getByLabelText("連絡内容"), {
    target: { value: draft.body },
  });
  fireEvent.click(screen.getByRole("button", { name: "送信する" }));
  return { onOpenChange, unmount };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("全体連絡の送信上限", () => {
  it("5回目は成功し、開き直して6回目を送ると下書きを残して上限エラーを表示する", async () => {
    useMockNotificationApi();
    const { id } = mockEvents[0];
    for (let sent = 0; sent < 4; sent++)
      await notifyEventParticipants(id, draft);

    const fifth = submitFromModal(id);
    await waitFor(() => expect(fifth.onOpenChange).toHaveBeenCalledWith(false));
    fifth.unmount();

    const sixth = submitFromModal(id);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "直近24時間で5回まで",
    );
    expect(sixth.onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("件名")).toHaveValue(draft.subject);
    expect(screen.getByLabelText("連絡内容")).toHaveValue(draft.body);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledTimes(6);
  });

  it("イベント別に数え、最初の送信から24時間経つとその1回分だけ再送できる", async () => {
    useMockNotificationApi();
    const { id } = mockEvents[1];
    const start = Date.now();
    const hour = 60 * 60 * 1000;
    const now = vi.spyOn(Date, "now").mockReturnValue(start);
    const send = () => notifyEventParticipants(id, draft);
    await send();
    now.mockReturnValue(start + hour);
    for (let sent = 1; sent < 5; sent++) await send();

    now.mockReturnValue(start + 24 * hour - 1);
    await expect(send()).rejects.toThrow();
    await notifyEventParticipants(mockEvents[2].id, draft);
    now.mockReturnValue(start + 24 * hour);
    await send();
    await expect(send()).rejects.toThrow();
  });

  it.each([
    ["notification_limit_exceeded", true],
    ["rate_limited", false],
  ])("APIの429 (%s) はエラーコードで区別する", async (code, isEventLimit) => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      Response.json(
        { error: { code, message: "API エラー" } },
        { status: 429 },
      ),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { onOpenChange } = submitFromModal("event-id");
    if (isEventLimit) {
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "今回は送信されていません",
      );
    } else {
      await waitFor(() => expect(toast.error).toHaveBeenCalledOnce());
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
