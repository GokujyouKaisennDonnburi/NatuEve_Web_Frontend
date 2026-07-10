// このファイルは、MSW（Mock Service Worker）を使用して、タグ関連のAPIエンドポイントのモックハンドラーを定義するためのものです。
import { HttpResponse, http } from "msw";

import { MAX_TAG_LENGTH } from "@/constants/config";

// メモリ内タグ管理：タグ名を保持し、重複作成（409 Conflict）の判定に使用する。
// MSW はプロセス内状態のためリロードでリセットされる前提。
const createdTags = new Set<string>();

export const tagHandlers = [
  // タグ作成モックエンドポイント（POST /api/v1/tags）。
  // 要認証。空文字 / 30文字超は 400、重複は 409 を返す。
  http.post("/api/v1/tags", async ({ request }) => {
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: { code: "unauthorized", message: "認証トークンが無効です" } },
        { status: 401 },
      );
    }

    // リクエストボディを取得する（本番 CreateTagRequest と同じ契約）。
    const body = (await request.json()) as { name?: unknown };

    // 本番のサーバー側バリデーションを模し、name の必須 / 上限文字数を検証する。
    const hasName = typeof body.name === "string" && body.name.length > 0;
    if (!hasName) {
      return HttpResponse.json(
        { error: { code: "invalid_request", message: "タグ名を入力してください" } },
        { status: 400 },
      );
    }

    const trimmed = (body.name as string).trim();
    if (trimmed.length > MAX_TAG_LENGTH) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: `タグ名は${MAX_TAG_LENGTH}文字以内で入力してください`,
          },
        },
        { status: 400 },
      );
    }

    // 重複作成は 409 で返す（バックエンドの ErrTagAlreadyExists 相当）。
    if (createdTags.has(trimmed)) {
      return HttpResponse.json(
        { error: { code: "duplicate_tag", message: "同じタグが既に存在します" } },
        { status: 409 },
      );
    }

    createdTags.add(trimmed);

    return HttpResponse.json(
      { id: crypto.randomUUID(), name: trimmed },
      { status: 201 },
    );
  }),
];
