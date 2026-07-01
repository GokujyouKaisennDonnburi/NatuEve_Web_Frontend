import { apiFetch } from "@/services/apiClient";
import type { CreateReportRequest, CreateReportResponse } from "@/types/report";

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
    throw new Error(`レポート作成に失敗しました (Status: ${response.status})`);
  }

  return (await response.json()) as CreateReportResponse;
}
