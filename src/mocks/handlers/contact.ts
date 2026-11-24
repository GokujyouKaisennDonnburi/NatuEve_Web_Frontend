// このファイルは、お問い合わせ送信モックエンドポイントを定義する。
// 認証不要。成功時は 202（受付完了・メール配信完了は別）を返す。
// NatuEve_API の POST /api/v1/contact（ADR-0052）の契約に合わせる。
import { HttpResponse, http } from "msw";

import { CONTACT_CATEGORIES } from "@/constants/contact";
import { MAX_CONTACT_MESSAGE_LENGTH } from "@/constants/config";
import type { ContactCategory } from "@/types/contact";

const CONTACT_CATEGORY_VALUES = CONTACT_CATEGORIES.map(
  (category) => category.value,
);

type ContactRequestBody = {
  category?: unknown;
  message?: unknown;
};

// gin の bindJSON（NatuEve_API internal/handler/bind.go）と同じく、
// ボディが JSON として解釈できない・型が合わない場合は 400 invalid_request。
const invalidRequestBody = () =>
  HttpResponse.json(
    {
      error: {
        code: "invalid_request",
        message: "リクエストボディが不正です",
      },
    },
    { status: 400 },
  );

export const contactHandlers = [
  http.post("/api/v1/contact", async ({ request }) => {
    let body: ContactRequestBody | undefined;
    try {
      body = (await request.json()) as ContactRequestBody;
    } catch {
      // JSON 以外のボディは不正なリクエストとして扱う
      body = undefined;
    }
    // JSON であってもオブジェクト以外（数値・文字列・配列等）は bindJSON が失敗するのと同じ扱い
    if (typeof body !== "object" || body === null) {
      return invalidRequestBody();
    }
    const { category, message } = body;

    if (
      typeof category !== "string" ||
      !CONTACT_CATEGORY_VALUES.includes(category as ContactCategory)
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

    if (typeof message !== "string") {
      return invalidRequestBody();
    }

    const trimmedMessage = message.trim();
    if ([...trimmedMessage].length > MAX_CONTACT_MESSAGE_LENGTH) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: `お問い合わせの本文は${MAX_CONTACT_MESSAGE_LENGTH}文字以内で入力してください`,
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
