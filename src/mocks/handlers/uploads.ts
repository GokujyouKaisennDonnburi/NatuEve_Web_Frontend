import { HttpResponse, http } from "msw";
import type { PresignRequest } from "@/types/upload";

// MSW 内で presign が返すダミー R2 ドメイン。このドメイン宛の PUT も下のハンドラが受ける。
const MOCK_R2_BASE = "https://mock.storage.test";

let uploadCounter = 0;

export const uploadHandlers = [
  http.post("/api/v1/uploads/presign", async ({ request }) => {
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: { code: "unauthorized", message: "認証トークンが無効です" } },
        { status: 401 },
      );
    }

    const body = (await request.json()) as PresignRequest;
    const id = `${Date.now()}-${++uploadCounter}`;
    const objectKey = `tmp/${body.kind}/${id}`;
    const uploadUrl = `${MOCK_R2_BASE}/${objectKey}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return HttpResponse.json({ uploadUrl, objectKey, expiresAt });
  }),

  // ダミー R2 への直接 PUT を受け取り、200 を返す
  http.put(`${MOCK_R2_BASE}/*`, () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
