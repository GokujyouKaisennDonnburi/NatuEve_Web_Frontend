import type { EventDetailResponse } from "@/types/event";

// イベント詳細のテスト用ビルダー。必須フィールドをまとめて定義し、
// テストごとに必要な値だけ overrides で差し替える。
export const buildEventDetail = (
  overrides: Partial<EventDetailResponse> = {},
): EventDetailResponse => ({
  capacity: 10,
  costs: [],
  createdAt: "2026-01-01T00:00:00+09:00",
  participantCount: 1,
  description: "イベントの説明",
  eventDate: "2026-08-01T10:00:00+09:00",
  endDate: "2026-08-01T12:00:00+09:00",
  id: "00000000-0000-4000-8000-000000000001",
  imageObjectKeys: [],
  imageFilenames: [],
  imageUrls: [],
  items: [],
  location: "東京都新宿区",
  pdfObjectKeys: [],
  pdfFilenames: [],
  pdfUrls: [],
  profile: {
    id: "profile-1",
    displayName: "主催者",
    avatarUrl: "",
  },
  title: "イベントタイトル",
  updatedAt: "2026-01-01T00:00:00+09:00",
  ...overrides,
});
