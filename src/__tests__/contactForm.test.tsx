import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "@/components/organisms/contact/ContactForm";
import { CONTACT_CATEGORIES } from "@/constants/contact";
import { MAX_CONTACT_MESSAGE_LENGTH } from "@/constants/config";
import { createContact } from "@/services/contact";
import { ContactError } from "@/types/contact";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// 送信 API は Service 経由で呼ぶため、Service をモックして画面側の挙動を検証する
vi.mock("@/services/contact", () => ({
  createContact: vi.fn(),
}));

const { mockBack, mockPush } = vi.hoisted(() => ({
  mockBack: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

const mockCreateContact = vi.mocked(createContact);

// router・Service・トーストのモックはテスト間で共有されるため、
// 呼び出し記録を毎回リセットする（cleanup は setup.ts の全体 afterEach で実行済み）
afterEach(() => {
  mockBack.mockClear();
  mockPush.mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  mockCreateContact.mockReset();
});

const submitForm = () => {
  fireEvent.click(screen.getByRole("button", { name: "送信する" }));
};

describe("ContactForm", () => {
  it("お問い合わせ内容の選択肢と送信ボタン・詳細の入力欄を表示する", () => {
    render(<ContactForm />);

    for (const option of CONTACT_CATEGORIES) {
      expect(
        screen.getByRole("radio", { name: option.label }),
      ).toBeInTheDocument();
    }
    expect(screen.getByRole("textbox", { name: "詳細" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "送信する" }),
    ).toBeInTheDocument();
  });

  it("カテゴリ未選択で送信するとエラーを表示し、API を呼ばない", () => {
    render(<ContactForm />);

    submitForm();

    expect(
      screen.getByText("お問い合わせ内容を選択してください"),
    ).toBeInTheDocument();
    expect(mockCreateContact).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("カテゴリを選択して送信すると API を呼び、完了トーストを表示して元の画面へ戻る", async () => {
    mockCreateContact.mockResolvedValue({
      category: "bug",
      message: "送信ボタンが反応しません",
      receivedAt: "2026-11-20T00:00:00.000Z",
    });

    // jsdom の初期履歴は 1 のため、履歴がある状態を再現する
    const historyLengthSpy = vi
      .spyOn(window.history, "length", "get")
      .mockReturnValue(2);

    try {
      render(<ContactForm />);

      fireEvent.click(screen.getByRole("radio", { name: "不具合報告" }));
      fireEvent.change(screen.getByRole("textbox", { name: "詳細" }), {
        target: { value: "送信ボタンが反応しません" },
      });
      submitForm();

      await waitFor(() => {
        expect(mockCreateContact).toHaveBeenCalledWith({
          category: "bug",
          message: "送信ボタンが反応しません",
        });
      });
      expect(toast.success).toHaveBeenCalledWith("お問い合わせを送信しました");
      expect(mockBack).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    } finally {
      historyLengthSpy.mockRestore();
    }
  });

  it("履歴がない状態で送信するとイベント一覧へ遷移する", async () => {
    mockCreateContact.mockResolvedValue({
      category: "bug",
      message: "",
      receivedAt: "2026-11-20T00:00:00.000Z",
    });

    render(<ContactForm />);

    fireEvent.click(screen.getByRole("radio", { name: "不具合報告" }));
    submitForm();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/event-list");
    });
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("API が失敗したら API のエラーメッセージを表示し、画面遷移しない", async () => {
    mockCreateContact.mockRejectedValue(
      new ContactError(
        "rate_limited",
        "お問い合わせの受付上限に達しました。時間をおいて再度お試しください",
        429,
      ),
    );

    render(<ContactForm />);

    fireEvent.click(screen.getByRole("radio", { name: "不具合報告" }));
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "お問い合わせの受付上限に達しました。時間をおいて再度お試しください",
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    // 送信は完了していないのでボタンは再び押せる状態に戻る
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "送信する" }),
      ).not.toBeDisabled();
    });
  });

  it("ネットワーク断など API 由来でないエラーは共通の文言を表示する", async () => {
    // Service は API 由来のエラーを ContactError で投げるため、
    // それ以外の Error（fetch の TypeError 等）は共通文言にフォールバックする
    mockCreateContact.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<ContactForm />);

    fireEvent.click(screen.getByRole("radio", { name: "不具合報告" }));
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "お問い合わせの送信に失敗しました。時間をおいて再度お試しください。",
      );
    });
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("送信中はボタンが非活性になり、二重に API を呼ばない", async () => {
    let resolveSubmit: (value: {
      category: "bug";
      message: string;
      receivedAt: string;
    }) => void = () => {};
    mockCreateContact.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(<ContactForm />);

    fireEvent.click(screen.getByRole("radio", { name: "不具合報告" }));
    submitForm();

    // 送信中は非活性になり、ラベルが送信中に切り替わる
    const submittingButton = await screen.findByRole("button", {
      name: "送信中...",
    });
    expect(submittingButton).toBeDisabled();

    // 連打しても API は一度しか呼ばれない
    fireEvent.click(submittingButton);
    expect(mockCreateContact).toHaveBeenCalledTimes(1);

    resolveSubmit({
      category: "bug",
      message: "",
      receivedAt: "2026-11-20T00:00:00.000Z",
    });
    await waitFor(() => {
      expect(mockCreateContact).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: "送信する" })).not.toBeDisabled();
  });

  it("カテゴリを選択するとエラー表示が消える", () => {
    render(<ContactForm />);

    submitForm();
    expect(
      screen.getByText("お問い合わせ内容を選択してください"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "要望" }));
    expect(
      screen.queryByText("お問い合わせ内容を選択してください"),
    ).not.toBeInTheDocument();
  });

  it("詳細が2000文字を超えるとエラーを表示し、API を呼ばない", () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole("radio", { name: "不具合報告" }));
    fireEvent.change(screen.getByRole("textbox", { name: "詳細" }), {
      target: { value: "あ".repeat(MAX_CONTACT_MESSAGE_LENGTH + 1) },
    });
    submitForm();

    expect(
      screen.getByText("詳細は2000文字以内で入力してください。"),
    ).toBeInTheDocument();
    // エラー文が textarea の aria-describedby で紐付いている
    expect(screen.getByRole("textbox", { name: "詳細" })).toHaveAttribute(
      "aria-describedby",
      expect.any(String),
    );
    expect(mockCreateContact).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("詳細を修正すると文字数エラー表示が消える", () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole("radio", { name: "不具合報告" }));
    fireEvent.change(screen.getByRole("textbox", { name: "詳細" }), {
      target: { value: "あ".repeat(MAX_CONTACT_MESSAGE_LENGTH + 1) },
    });
    submitForm();
    expect(
      screen.getByText("詳細は2000文字以内で入力してください。"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "詳細" }), {
      target: { value: "不具合の報告です" },
    });
    expect(
      screen.queryByText("詳細は2000文字以内で入力してください。"),
    ).not.toBeInTheDocument();
  });
});
