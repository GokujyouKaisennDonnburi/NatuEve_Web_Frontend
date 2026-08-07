// イベント投稿フォームの目次セクション定義。
// id は EventPostForm 側のセクション div とアンカーリンクの両方から参照する共通の情報源。
export const EVENT_TITLE_SECTION_ID = "event-title";
export const EVENT_TAGS_SECTION_ID = "event-tags";
export const EVENT_SCHEDULE_SECTION_ID = "event-schedule";
export const EVENT_FEE_SECTION_ID = "event-fee";
export const EVENT_ITEMS_SECTION_ID = "event-items";
export const EVENT_ATTACHMENTS_SECTION_ID = "event-attachments";
export const EVENT_OVERVIEW_SECTION_ID = "event-overview";

export const EVENT_POST_TOC_SECTIONS = [
  { id: EVENT_TITLE_SECTION_ID, label: "イベントタイトル" },
  { id: EVENT_TAGS_SECTION_ID, label: "タグ" },
  { id: EVENT_SCHEDULE_SECTION_ID, label: "開催情報" },
  { id: EVENT_FEE_SECTION_ID, label: "参加費用" },
  { id: EVENT_ITEMS_SECTION_ID, label: "持ち物" },
  { id: EVENT_ATTACHMENTS_SECTION_ID, label: "添付資料" },
  { id: EVENT_OVERVIEW_SECTION_ID, label: "イベント概要" },
] as const;

export type EventPostTocSectionId =
  (typeof EVENT_POST_TOC_SECTIONS)[number]["id"];
