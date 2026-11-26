import { EVENT_GONE_STATUS } from "@/lib/errors";
import { apiFetch } from "@/services/apiClient";
import type {
  CreateReportErrorBody,
  CreateReportRequest,
  CreateReportResponse,
  GetReportErrorBody,
  ReportDetail,
} from "@/types/report";

// レポート作成 API（POST /api/v1/reports）を呼ぶ（要認証）。
//
// 画像/PDF は事前に presign → R2 直 PUT 済みで、payload には objectKey のみを渡す。
// 検証エラー（400）等は response.ok=false となり、ここで例外を送出して呼び出し側の
// submit を中断させる。
export async function createReport(
  payload: CreateReportRequest,
): Promise<CreateReportResponse> {
  const response = await apiFetch("/api/v1/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // バックエンドは { error: { code, message } } 形式でエラー詳細を返す。
    // message を取得できれば toast 表示に活かす。取得失敗時はステータスでフォールバック。
    let message: string | undefined;
    try {
      const body = (await response.json()) as CreateReportErrorBody;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new Error(
      message ?? `レポート作成に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as CreateReportResponse;
}

// レポート取得 API（GET /api/v1/events/{eventId}/report）を呼ぶ（認証不要）。
//
// 1 イベントにつき 1 レポート。レポート未投稿時は 404 となるため、
// 404 の場合は null を返して「レポート無し」として扱う。
// 取りやめ済みのイベントは 410 となるため、同じく「レポート無し」として扱う（ADR-0008）。
// それ以外のエラー（500 等）は例外を送出する。
export async function getReport(
  eventId: string,
  signal?: AbortSignal,
): Promise<ReportDetail | null> {
  const response = await apiFetch(
    `/api/v1/events/${encodeURIComponent(eventId)}/report`,
    {
      method: "GET",
      auth: false,
      signal,
    },
  );

  // 404 は「レポート未投稿」、410 は「取りやめ済みのイベント」の正常系として null を返す。
  // 410 の判定は HTTP ステータスのみで行い、レスポンス本文には依存しない。
  if (response.status === 404 || response.status === EVENT_GONE_STATUS) {
    return null;
  }

  if (!response.ok) {
    let message: string | undefined;
    try {
      const body = (await response.json()) as GetReportErrorBody;
      message = body?.error?.message;
    } catch {
      // JSON 以外のボディは無視する
    }

    throw new Error(
      message ?? `レポート取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as ReportDetail;
}
