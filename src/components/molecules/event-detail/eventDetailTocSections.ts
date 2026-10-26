// イベント詳細画面の目次セクション定義。
// id は EventDetail 側のセクション要素とアンカーリンクの両方から参照する共通の情報源。

// セクションID
export const EVENT_DETAIL_OVERVIEW_SECTION_ID = "event-detail-overview";
export const EVENT_DETAIL_INFO_SECTION_ID = "event-detail-info";
export const EVENT_DETAIL_ATTACHMENTS_SECTION_ID = "event-detail-attachments";

// 見出しと目次で共有する文言
export const EVENT_DETAIL_INFO_SECTION_LABEL = "イベント詳細";

// 目次の表示順
export const EVENT_DETAIL_TOC_SECTIONS = [
  { id: EVENT_DETAIL_OVERVIEW_SECTION_ID, label: "イベント概要" },
  { id: EVENT_DETAIL_INFO_SECTION_ID, label: EVENT_DETAIL_INFO_SECTION_LABEL },
  { id: EVENT_DETAIL_ATTACHMENTS_SECTION_ID, label: "添付資料" },
] as const;

export type EventDetailTocSectionId =
  (typeof EVENT_DETAIL_TOC_SECTIONS)[number]["id"];
