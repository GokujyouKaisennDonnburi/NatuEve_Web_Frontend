import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getResponse } from "msw";
import { useState } from "react";
import { toast } from "sonner";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest";

import { EventNotifyModal } from "@/components/molecules/event-detail/EventNotifyModal";
import { mockEventDetails } from "@/mocks/handlers/events/data";
import { eventMembers } from "@/mocks/handlers/events/participation";
import {
  eventNotificationHandler,
  resetNotificationSendTimes,
} from "@/mocks/handlers/events/notifications";
import { apiFetch } from "@/services/apiClient";
import { notifyEventParticipants } from "@/services/event";
import { MOCK_AUTH_SESSION } from "@/services/mockAuth";
import { NotificationLimitExceededError } from "@/types/event";

vi.mock("@/services/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const draft = { subject: "集合場所", body: "駅前に集合してください。" };

function setRecipients(eventId: string, count: number) {
  eventMembers.set(
    eventId,
    Array.from({ length: count }, (_, index) => ({
      username: `参加者${index + 1}`,
      mailAddress: `guest-${index + 1}@example.com`,
      partySize: 2,
      profile: null,
      createdAt: "2026-01-01T00:00:00Z",
    })),
  );
}

function createNotificationEvent(ownerId = MOCK_AUTH_SESSION.userId) {
  const id = crypto.randomUUID();
  const profile = { id: ownerId, displayName: "主催者", avatarUrl: "" };
  mockEventDetails.set(id, {
    id,
    profile,
    profileId: ownerId,
    organizerName: profile.displayName,
    organizerAvatarUrl: profile.avatarUrl,
    title: "自然観察会",
    description: "公園を歩きます",
    location: "駅前",
    costs: [],
    createdAt: "2026-01-01T00:00:00Z",
    eventDate: "2026-02-01T00:00:00Z",
    endDate: "2026-02-01T03:00:00Z",
  });
  setRecipients(id, 1);
  onTestFinished(() => {
    mockEventDetails.delete(id);
    eventMembers.delete(id);
  });
  return id;
}

function setupMockNotificationApi() {
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

function NotificationModalHost({ eventId }: { eventId: string }) {
  const [isOpen, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        全体連絡を開く
      </button>
      <EventNotifyModal
        isOpen={isOpen}
        onOpenChange={setOpen}
        eventId={eventId}
        totalCount={1}
        totalMembers={2}
      />
    </>
  );
}

function submitDraft() {
  fireEvent.change(screen.getByLabelText("件名"), {
    target: { value: draft.subject },
  });
  fireEvent.change(screen.getByLabelText("連絡内容"), {
    target: { value: draft.body },
  });
  fireEvent.click(screen.getByRole("button", { name: "送信する" }));
}

beforeEach(() => {
  resetNotificationSendTimes();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("全体連絡の送信上限", () => {
  it("5回目は成功し、開き直して6回目を送ると下書きを残して上限エラーを表示する", async () => {
    setupMockNotificationApi();
    const id = createNotificationEvent();
    for (let sent = 0; sent < 4; sent++)
      await notifyEventParticipants(id, draft);

    render(<NotificationModalHost eventId={id} />);
    submitDraft();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledOnce();

    const openButton = screen.getByRole("button", { name: "全体連絡を開く" });
    fireEvent.click(openButton);
    submitDraft();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "直近24時間で5回まで",
    );
    expect(screen.getByLabelText("件名")).toHaveValue(draft.subject);
    expect(screen.getByLabelText("連絡内容")).toHaveValue(draft.body);
    expect(toast.success).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(openButton);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("件名")).toHaveValue("");
    expect(screen.getByLabelText("連絡内容")).toHaveValue("");
    expect(apiFetch).toHaveBeenCalledTimes(6);
  });

  it("イベント別に数え、最初の送信から24時間経つとその1回分だけ再送できる", async () => {
    setupMockNotificationApi();
    const id = createNotificationEvent();
    const otherId = createNotificationEvent();
    const start = Date.now();
    const hour = 60 * 60 * 1000;
    const now = vi.spyOn(Date, "now").mockReturnValue(start);
    const send = () => notifyEventParticipants(id, draft);
    await send();
    now.mockReturnValue(start + hour);
    for (let sent = 1; sent < 5; sent++) await send();

    now.mockReturnValue(start + 24 * hour - 1);
    await expect(send()).rejects.toMatchObject({
      name: "NotificationLimitExceededError",
    });
    await notifyEventParticipants(otherId, draft);
    now.mockReturnValue(start + 24 * hour);
    await send();
    await expect(send()).rejects.toBeInstanceOf(NotificationLimitExceededError);
  });

  it("主催者以外は参加者がいても送信できない", async () => {
    setupMockNotificationApi();
    const id = createNotificationEvent("other-owner");
    await expect(notifyEventParticipants(id, draft)).rejects.toThrow(
      "このイベントを操作する権限がありません",
    );
  });

  it("宛先が0件・101件の送信は枠を消費せず、100件なら5回まで送れる", async () => {
    setupMockNotificationApi();
    const id = createNotificationEvent();
    const send = () => notifyEventParticipants(id, draft);
    setRecipients(id, 0);
    await expect(send()).rejects.toThrow("送信先の参加者がいません");
    setRecipients(id, 101);
    await expect(send()).rejects.toThrow("送信先の参加者が多すぎます");
    setRecipients(id, 100);
    for (let sent = 0; sent < 5; sent++) {
      await expect(send()).resolves.toEqual({
        eventId: id,
        recipientCount: 100,
        sentCount: 100,
        failedCount: 0,
      });
    }
    await expect(send()).rejects.toBeInstanceOf(NotificationLimitExceededError);
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
    render(<NotificationModalHost eventId="event-id" />);
    submitDraft();
    if (isEventLimit) {
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "今回は送信されていません",
      );
    } else {
      await waitFor(() => expect(toast.error).toHaveBeenCalledOnce());
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
