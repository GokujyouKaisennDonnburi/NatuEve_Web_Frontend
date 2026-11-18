import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CONTACT_CATEGORIES,
  ContactForm,
} from "@/components/organisms/contact/ContactForm";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// globals: false のため、testing-library の自動クリーンアップが効かない。
// render したフォームがテストをまたいで残らないよう明示的に片付ける。
afterEach(() => {
  cleanup();
});

// 可視ラベルと結合したアクセシブルネームになるため、ラジオは value で特定する。

describe("ContactForm", () => {
  it("お問い合わせ内容の選択肢と送信ボタン・要望の入力欄を表示する", () => {
    render(<ContactForm />);

    for (const option of CONTACT_CATEGORIES) {
      expect(screen.getByDisplayValue(option.value)).toBeInTheDocument();
    }
    expect(screen.getByRole("textbox", { name: "要望" })).toBeInTheDocument();
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

  it("カテゴリを選択して送信するとトーストを表示する", () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByDisplayValue("bug"));
    fireEvent.change(screen.getByRole("textbox", { name: "要望" }), {
      target: { value: "送信ボタンが反応しません" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    expect(toast.success).toHaveBeenCalledWith("お問い合わせを送信しました");
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
