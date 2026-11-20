import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { contactHandlers } from "@/mocks/handlers/contact";
import { createContact } from "@/services/contact";
import type { ContactCategory } from "@/types/contact";

// お問い合わせ送信モックの挙動を検証する。
// ハンドラーを実際に HTTP で往復させ、画面が依存する POST /api/v1/contact の
// 契約（202 受付完了・エラーは { error: { code, message } }）を確認する。
const server = setupServer(...contactHandlers);

// MSW は相対パスのハンドラーを jsdom の location.origin 基準で解決するため、
// リクエストも同じ origin に合わせる。
const origin = () => window.location.origin;

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

  it("message が文字列以外のリクエストは 400（リクエストボディ不正）で失敗する", async () => {
    // Service の型では表現できない型不一致を、直接 fetch で再現する
    const response = await fetch(`${origin()}/api/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "bug", message: 123 }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.message).toBe("リクエストボディが不正です");
  });
});
