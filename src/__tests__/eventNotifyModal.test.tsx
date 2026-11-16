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

function submitDraft(values = draft) {
  fireEvent.change(screen.getByLabelText("件名"), {
    target: { value: values.subject },
  });
  fireEvent.change(screen.getByLabelText("連絡内容"), {
    target: { value: values.body },
  });
  fireEvent.click(screen.getByRole("button", { name: "送信する" }));
}

function postNotification(eventId: string, payload = draft) {
  return apiFetch(`/api/v1/events/${eventId}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
    await expect(send()).rejects.toBeInstanceOf(NotificationLimitExceededError);
    await notifyEventParticipants(otherId, draft);
    now.mockReturnValue(start + 24 * hour);
    await send();
    await expect(send()).rejects.toBeInstanceOf(NotificationLimitExceededError);
  });

  it("主催者以外は参加者がいても送信できない", async () => {
    setupMockNotificationApi();
    const id = createNotificationEvent("other-owner");
    const response = await postNotification(id);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "forbidden" },
    });
  });

  it("存在しないイベントは主催者確認で400になる", async () => {
    setupMockNotificationApi();
    const response = await postNotification(crypto.randomUUID());
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "invalid_request" },
    });
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

describe.each([
  { field: "subject", label: "件名", limit: 255 },
  { field: "body", label: "連絡内容", limit: 10_000 },
] as const)("全体連絡の文字数: $label", ({ field, label, limit }) => {
  const atLimit = "🌱".repeat(limit);
  const overLimit = `${atLimit}あ`;

  it("画面では超過の理由を表示し、上限ちょうどに直すと送れる", async () => {
    setupMockNotificationApi();
    render(<NotificationModalHost eventId={createNotificationEvent()} />);
    submitDraft({ ...draft, [field]: overLimit });

    const input = screen.getByLabelText(label);
    const send = screen.getByRole("button", { name: "送信する" });
    expect(input).toHaveValue(overLimit);
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining(`${limit}文字以内`),
    );
    expect(send).toBeDisabled();
    expect(apiFetch).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: `　${atLimit}　` } });
    expect(send).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(send);
    await waitFor(() => expect(toast.success).toHaveBeenCalledOnce());
    expect(apiFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: JSON.stringify({ ...draft, [field]: atLimit }),
      }),
    );
  });

  it("モックは超過を400で拒否し、残り1回の枠で上限ちょうどを受け付ける", async () => {
    setupMockNotificationApi();
    const id = createNotificationEvent();
    for (let sent = 0; sent < 4; sent++)
      await notifyEventParticipants(id, draft);
    const rejected = await postNotification(id, {
      ...draft,
      [field]: overLimit,
    });
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({
      error: { code: "invalid_request" },
    });
    // U+0085 は Go の TrimSpace が取り除く空白。絵文字は rune 1個として数える。
    const accepted = await postNotification(id, {
      ...draft,
      [field]: `\u0085${atLimit}　`,
    });
    expect(accepted.status).toBe(200);
    await expect(notifyEventParticipants(id, draft)).rejects.toBeInstanceOf(
      NotificationLimitExceededError,
    );
  });
});
