import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventParticipationButton } from "@/components/organisms/EventParticipationButton";

// 参加申し込みボタンが externalUrl の値に応じて「外部URLへの遷移（リンク）」と
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
    receptionClosed?: boolean;
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
      receptionClosed={props.receptionClosed}
      {...props}
    />,
  );
};

const clickApply = () => {
  fireEvent.click(screen.getByRole("button", { name: "参加を申し込む" }));
};

describe("EventParticipationButton の externalUrl 分岐", () => {
  afterEach(() => {
    cleanup();
  });

  it("externalUrl が設定されている場合はモーダルを開かず外部URLへのリンクを表示する", () => {
    renderButton({ externalUrl: " https://example.com/event " });

    // 外部受付はリンクとして描画され、前後の空白を除いたURLへ遷移する
    const link = screen.getByRole("link", { name: /参加を申し込む/ });
    expect(link).toHaveAttribute("href", "https://example.com/event");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // 無効条件がないため aria-disabled は付かない
    expect(link).not.toHaveAttribute("aria-disabled");
    expect(screen.queryByTestId("participation-modal")).not.toBeInTheDocument();
  });

  it("定員が満員でも externalUrl があれば外部URLへの遷移ができる", () => {
    // externalUrl と capacity が併存するイベントでも、満員は外部受付と無関係
    renderButton({
      externalUrl: "https://example.com/event",
      capacity: 30,
      participantCount: 30,
    });

    const link = screen.getByRole("link", { name: /参加を申し込む/ });
    // 「現在満員です」にならず、遷移できる状態のまま
    expect(link).toHaveTextContent("参加を申し込む");
    expect(link).not.toHaveAttribute("aria-disabled");
    expect(screen.queryByTestId("participation-modal")).not.toBeInTheDocument();
  });

  it("受付終了の externalUrl イベントではリンクを表示せず、href を持たない無効なボタンになる", () => {
    renderButton({
      externalUrl: "https://example.com/event",
      receptionClosed: true,
    });

    // href 付きの a 要素のままでは中クリック等で遷移できてしまうため、リンクは出さない
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "受付終了" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("href");
    expect(screen.queryByTestId("participation-modal")).not.toBeInTheDocument();
  });

  it("externalUrl が未設定の場合は従来どおり参加申し込みモーダルを開く", () => {
    renderButton();

    clickApply();

    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });

  it("externalUrl が空文字・null の場合も参加申し込みモーダルを開く", () => {
    renderButton({ externalUrl: null });
    clickApply();
    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();

    cleanup();

    renderButton({ externalUrl: "   " });
    clickApply();
    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });

  it("URLとして解釈できない不正な文字列でもクラッシュせずモーダルへフォールバックする", () => {
    renderButton({ externalUrl: "not a url" });

    expect(() => clickApply()).not.toThrow();

    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });

  it("javascript: 等の危険なスキームでも遷移せずモーダルへフォールバックする", () => {
    renderButton({ externalUrl: "javascript:alert(1)" });

    clickApply();

    expect(screen.getByTestId("participation-modal")).toBeInTheDocument();
  });
});

describe("EventParticipationButton の externalUrl 表示", () => {
  afterEach(() => {
    cleanup();
  });

  it("externalUrl が設定されている場合は定員・残り人数・プログレスバーを出さずリンクだけを出す", () => {
    renderButton({ externalUrl: "https://example.com/event" });

    expect(
      screen.getByRole("link", { name: /参加を申し込む/ }),
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
