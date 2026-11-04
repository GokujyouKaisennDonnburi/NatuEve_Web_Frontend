import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import { EventParticipationButton } from "@/components/organisms/EventParticipationButton";

// 参加申し込みボタンが externalUrl の値に応じて「外部URLへの遷移」と
// 「モーダル表示」を分岐できることを確かめるテスト。

// AuthProvider（Supabase セッション）に依存するため、待ち時間ゼロの状態へ差し替える。
vi.mock("@/components/layouts/AuthProvider", () => ({
  useAuthContext: () => ({ isSessionLoading: false }),
}));

// モーダルの中身は分岐対象ではない。開いたかどうかだけ確かめたいのでスタブに置き換える。
// 開いているときだけ data-testid 付きの要素を出す。
vi.mock("@/components/organisms/participation/ParticipationModal", () => ({
  ParticipationModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="participation-modal" /> : null,
}));

vi.mock(
  "@/components/organisms/participation/ParticipationDetailModal",
  () => ({
    ParticipationDetailModal: () => null,
  }),
);

vi.mock(
  "@/components/organisms/participation/ParticipationCancelConfirmModal",
  () => ({
    ParticipationCancelConfirmModal: () => null,
  }),
);

vi.mock(
  "@/components/organisms/participation/ParticipationAbsenceModal",
  () => ({
    ParticipationAbsenceModal: () => null,
  }),
);

const renderButton = (
  props: {
    externalUrl?: string | null;
    capacity?: number;
    participantCount?: number;
  } = {},
) => {
  render(
    <EventParticipationButton
      eventId="event-1"
      eventTitle="テストイベント"
      eventDate="2026-11-10T10:00:00+09:00"
      eventEndDate="2026-11-10T12:00:00+09:00"
      eventLocation="テスト会場"
      costs={[]}
      capacity={props.capacity}
      participantCount={props.participantCount}
      {...props}
    />,
  );
};

const clickApply = () => {
  fireEvent.click(screen.getByRole("button", { name: "参加を申し込む" }));
};

describe("EventParticipationButton の externalUrl 分岐", () => {
  let openSpy: MockInstance<typeof window.open>;

  beforeEach(() => {
    // jsdom には window.open の実装が無いため、呼び出し引数を記録するスパイに差し替える。
    openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
    cleanup();
  });

  it("externalUrl が設定されている場合はモーダルを開かず外部URLへ新規タブ遷移する", () => {
    renderButton({ externalUrl: " https://example.com/event " });

    clickApply();

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/event",
      "_blank",
      "noopener,noreferrer",
    );
    expect(screen.queryByTestId("participation-modal")).not.toBeInTheDocument();
  });

  it("externalUrl が未設定の場合は従来どおり参加申し込みモーダルを開く", () => {
    renderButton();

    clickApply();

    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });

  it("externalUrl が空文字・null の場合も参加申し込みモーダルを開く", () => {
    renderButton({ externalUrl: null });
    clickApply();
    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();

    cleanup();
    openSpy.mockClear();

    renderButton({ externalUrl: "   " });
    clickApply();
    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });

  it("URLとして解釈できない不正な文字列でもクラッシュせずモーダルへフォールバックする", () => {
    renderButton({ externalUrl: "not a url" });

    expect(() => clickApply()).not.toThrow();

    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });

  it("javascript: 等の危険なスキームでも遷移せずモーダルへフォールバックする", () => {
    renderButton({ externalUrl: "javascript:alert(1)" });

    clickApply();

    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });
});

describe("EventParticipationButton の externalUrl 表示", () => {
  afterEach(() => {
    cleanup();
  });

  it("externalUrl が設定されている場合は定員・残り人数・プログレスバーを出さずボタンだけを出す", () => {
    renderButton({ externalUrl: "https://example.com/event" });

    expect(
      screen.getByRole("button", { name: "参加を申し込む" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/定員\d+名/)).not.toBeInTheDocument();
    expect(screen.queryByText(/残り\d+名/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("externalUrl が未設定の場合は従来どおり定員・残り人数・プログレスバーを出す", () => {
    renderButton({ externalUrl: null, capacity: 30, participantCount: 10 });

    expect(screen.getByText("定員30名")).toBeInTheDocument();
    expect(screen.getByText("残り20名")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "参加を申し込む" }),
    ).toBeInTheDocument();
  });

  it("externalUrl が不正値の場合も従来どおり定員・プログレスバー付きで表示する", () => {
    renderButton({
      externalUrl: "not a url",
      capacity: 30,
      participantCount: 10,
    });

    expect(screen.getByText("定員30名")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
