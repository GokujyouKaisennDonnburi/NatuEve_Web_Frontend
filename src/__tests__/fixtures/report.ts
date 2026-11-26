import type { ReportDetail } from "@/types/report";

// レポート詳細のテスト用ビルダー。必須フィールドをまとめて定義し、
// テストごとに必要な値だけ overrides で差し替える。
export const buildReport = (
  overrides: Partial<ReportDetail> = {},
): ReportDetail => ({
  id: "report-1",
  eventId: "00000000-0000-4000-8000-000000000001",
  createdAt: "2026-01-01T00:00:00+09:00",
  updatedAt: "2026-01-01T00:00:00+09:00",
  ...overrides,
});
