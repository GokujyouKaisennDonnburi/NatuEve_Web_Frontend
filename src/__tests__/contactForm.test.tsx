import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CONTACT_CATEGORIES,
  ContactForm,
} from "@/components/organisms/contact/ContactForm";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const { mockBack, mockPush } = vi.hoisted(() => ({
  mockBack: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

// globals: false のため、testing-library の自動クリーンアップが効かない。
// render したフォームがテストをまたいで残らないよう明示的に片付ける。
afterEach(() => {
  cleanup();
  mockBack.mockClear();
  mockPush.mockClear();
});

// 可視ラベルと結合したアクセシブルネームになるため、ラジオは value で特定する。

describe("ContactForm", () => {
  it("お問い合わせ内容の選択肢と送信ボタン・詳細の入力欄を表示する", () => {
    render(<ContactForm />);

    for (const option of CONTACT_CATEGORIES) {
      expect(screen.getByDisplayValue(option.value)).toBeInTheDocument();
    }
    expect(screen.getByRole("textbox", { name: "詳細" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "送信する" }),
    ).toBeInTheDocument();
  });

  it("カテゴリ未選択で送信するとエラーを表示し、トーストを出さない", () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    expect(
      screen.getByText("お問い合わせ内容を選択してください"),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("カテゴリを選択して送信するとトーストを表示し、元の画面へ戻る", () => {
    // jsdom の初期履歴は 1 のため、履歴がある状態を再現する
    const historyLengthSpy = vi
      .spyOn(window.history, "length", "get")
      .mockReturnValue(2);

    render(<ContactForm />);

    fireEvent.click(screen.getByDisplayValue("bug"));
    fireEvent.change(screen.getByRole("textbox", { name: "詳細" }), {
      target: { value: "送信ボタンが反応しません" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    expect(toast.success).toHaveBeenCalledWith("お問い合わせを送信しました");
    expect(mockBack).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();

    historyLengthSpy.mockRestore();
  });

  it("履歴がない状態で送信するとイベント一覧へ遷移する", () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByDisplayValue("bug"));
    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    expect(mockPush).toHaveBeenCalledWith("/event-list");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("カテゴリを選択するとエラー表示が消える", () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole("button", { name: "送信する" }));
    expect(
      screen.getByText("お問い合わせ内容を選択してください"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByDisplayValue("request"));
    expect(
      screen.queryByText("お問い合わせ内容を選択してください"),
    ).not.toBeInTheDocument();
  });
});
