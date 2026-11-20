// このファイルは、お問い合わせ送信モックエンドポイントを定義する。
// 認証不要。成功時は 202（受付完了・メール配信完了は別）を返す。
// NatuEve_API の POST /api/v1/contact（ADR-0052）の契約に合わせる。
import { HttpResponse, http } from "msw";

import type { ContactCategory } from "@/types/contact";

const CONTACT_CATEGORIES: readonly ContactCategory[] = [
  "request",
  "bug",
  "other",
];

// NatuEve_API internal/service/contact.go の contactMessageMaxLength と一致させる
const CONTACT_MESSAGE_MAX_LENGTH = 2000;

export const contactHandlers = [
  http.post("/api/v1/contact", async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // JSON 以外のボディは不正なリクエストとして扱う
      body = undefined;
    }

    const category = (body as { category?: unknown } | undefined)?.category;
    const message = (body as { message?: unknown } | undefined)?.message;

    if (
      typeof category !== "string" ||
      !CONTACT_CATEGORIES.includes(category as ContactCategory)
    ) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "お問い合わせ内容を選択してください",
          },
        },
        { status: 400 },
      );
    }

    const trimmedMessage =
      typeof message === "string" ? message.trim() : String(message ?? "");
    if ([...trimmedMessage].length > CONTACT_MESSAGE_MAX_LENGTH) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "お問い合わせの本文は2000文字以内で入力してください",
          },
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        category,
        message: trimmedMessage,
        receivedAt: new Date().toISOString(),
      },
      { status: 202 },
    );
  }),
];
