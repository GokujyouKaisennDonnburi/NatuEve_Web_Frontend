// このファイルは、イベントに対するレポート取得モックエンドポイントを定義する。
// 認証不要・1イベント1レポート。レポート未投稿時は 404 を返す。
import { HttpResponse, http } from "msw";

import { mockEventDetails } from "./data";

export const eventReportHandler = http.get(
  "/api/v1/events/:id/report",
  ({ params }) => {
    const id = String(params?.id ?? "");
    const found = mockEventDetails.get(id);
    const report = found?.reports?.[0];
    if (!found || !report) {
      return HttpResponse.json(
        {
          error: {
            code: "not_found",
            message: "レポートが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    // GET /api/v1/events/{id}/report のレスポンス形式に合わせて返す
    return HttpResponse.json({
      id: report.id,
      eventId: id,
      content: report.content,
      externalUrls:
        typeof report.externalUrl === "string" && report.externalUrl.length > 0
          ? [report.externalUrl]
          : [],
      imageObjectKeys: [],
      imageFilenames: [],
      imageUrls: report.imageUrls ?? [],
      pdfObjectKeys: [],
      pdfFilenames: [],
      pdfUrls: report.pdfUrls ?? [],
      createdAt: report.createdAt,
      updatedAt: report.createdAt,
    });
  },
);
