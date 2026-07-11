// このファイルは、MSW（Mock Service Worker）を使用して、タグ関連のAPIエンドポイントのモックハンドラーを定義するためのものです。
import { HttpResponse, http } from "msw";

import { MAX_TAG_LENGTH } from "@/constants/config";

// メモリ内タグ管理：タグ名→{ id, name } のマップ。重複作成（409 Conflict）の判定と
// 一覧取得（GET /api/v1/tags）のデータソースとして使用する。
// MSW はプロセス内状態のためリロードでリセットされる前提。
const SEED_TAGS: { id: string; name: string }[] = [
  { id: "a1000000-0000-4000-8000-000000000001", name: "自然観察" },
  { id: "a1000000-0000-4000-8000-000000000002", name: "ファミリー向け" },
  { id: "a1000000-0000-4000-8000-000000000003", name: "生き物" },
  { id: "a1000000-0000-4000-8000-000000000004", name: "屋外" },
  { id: "a1000000-0000-4000-8000-000000000005", name: "ハイキング" },
  { id: "a1000000-0000-4000-8000-000000000006", name: "初心者歓迎" },
  { id: "a1000000-0000-4000-8000-000000000007", name: "野鳥" },
  { id: "a1000000-0000-4000-8000-000000000008", name: "双眼鏡推奨" },
  { id: "a1000000-0000-4000-8000-000000000009", name: "写真撮影" },
  { id: "a1000000-0000-4000-8000-00000000000a", name: "ワークショップ" },
  { id: "a1000000-0000-4000-8000-00000000000b", name: "雨天決行" },
  { id: "a1000000-0000-4000-8000-00000000000c", name: "要予約" },
  { id: "a1000000-0000-4000-8000-00000000000d", name: "環境保全" },
  { id: "a1000000-0000-4000-8000-00000000000e", name: "外来生物" },
  { id: "a1000000-0000-4000-8000-00000000000f", name: "子ども同伴可" },
];
const tagStore = new Map<string, { id: string; name: string }>(
  SEED_TAGS.map((t) => [t.name, t]),
);

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
        {
          error: {
            code: "invalid_request",
            message: "タグ名を入力してください",
          },
        },
        { status: 400 },
      );
    }

    const trimmed = (body.name as string).trim();
    // 本番の service.TagService.Create と同じく trim 後の空文字を弾く。
    // 入力が " " のみのようなケースも 400 invalid_request とする。
    if (trimmed.length === 0) {
      return HttpResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "タグ名を入力してください",
          },
        },
        { status: 400 },
      );
    }
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
    if (tagStore.has(trimmed)) {
      return HttpResponse.json(
        {
          error: {
            code: "duplicate_tag",
            message: "同じタグが既に存在します",
          },
        },
        { status: 409 },
      );
    }

    const id = crypto.randomUUID();
    tagStore.set(trimmed, { id, name: trimmed });

    return HttpResponse.json(
      { id, name: trimmed },
      { status: 201 },
    );
  }),

  // タグ一覧取得モックエンドポイント（GET /api/v1/tags）。
  // 認証不要。全タグを配列で返す。
  http.get("/api/v1/tags", () => {
    const tags = Array.from(tagStore.values());
    return HttpResponse.json({ tags });
  }),
];
