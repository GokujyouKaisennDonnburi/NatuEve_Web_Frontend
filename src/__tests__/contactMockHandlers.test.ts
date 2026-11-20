import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { contactHandlers } from "@/mocks/handlers/contact";
import { createContact } from "@/services/contact";
import type { ContactCategory } from "@/types/contact";

// お問い合わせ送信モックの挙動を検証する。
// ハンドラーを実際に HTTP で往復させ、画面が依存する POST /api/v1/contact の
// 契約（202 受付完了・エラーは { error: { code, message } }）を確認する。
const server = setupServer(...contactHandlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

describe("POST /api/v1/contact のモック", () => {
  it("正常なリクエストは 202 で受付内容を返す", async () => {
    const response = await createContact({
      category: "bug",
      message: "送信ボタンが反応しません",
    });

    expect(response.category).toBe("bug");
    expect(response.message).toBe("送信ボタンが反応しません");
    // receivedAt は RFC3339 で返る
    expect(new Date(response.receivedAt).toISOString()).toBe(
      response.receivedAt,
    );
  });

  it("詳細の前後の空白は除去して返す", async () => {
    const response = await createContact({
      category: "request",
      message: "  検索条件を増やしてほしいです  ",
    });

    expect(response.message).toBe("検索条件を増やしてほしいです");
  });

  it("カテゴリ不正はエラーメッセージ付きで失敗する", async () => {
    await expect(
      createContact({
        category: "unknown" as ContactCategory,
        message: "",
      }),
    ).rejects.toThrow("お問い合わせ内容を選択してください");
  });

  it("2000文字を超える詳細はエラーメッセージ付きで失敗する", async () => {
    await expect(
      createContact({
        category: "bug",
        message: "あ".repeat(2001),
      }),
    ).rejects.toThrow("お問い合わせの本文は2000文字以内で入力してください");
  });
});
