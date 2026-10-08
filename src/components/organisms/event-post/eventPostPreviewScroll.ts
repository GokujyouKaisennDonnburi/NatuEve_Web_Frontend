// 入力→プレビュー切替時に、入力で見ていた項目に対応する所をプレビューで表示するための定義。
import {
  EVENT_DETAIL_ATTACHMENTS_SECTION_ID,
  EVENT_DETAIL_INFO_SECTION_ID,
  EVENT_DETAIL_OVERVIEW_SECTION_ID,
} from "@/components/molecules/event-detail/eventDetailTocSections";
import type { ScrollSyncMapping } from "@/utils/scrollSync";

import {
  EVENT_FEE_SECTION_ID,
  EVENT_ITEMS_SECTION_ID,
  EVENT_OVERVIEW_SECTION_ID,
  EVENT_RECEPTION_SECTION_ID,
  EVENT_SCHEDULE_SECTION_ID,
  EVENT_TAGS_SECTION_ID,
  EVENT_TITLE_SECTION_ID,
} from "./eventPostTocSections";

// 入力の添付資料セクション内の画像カードと資料カード。
// プレビューでは画像が先頭、資料が末尾と離れて表示されるため、目次とは別に分けて扱う。
export const EVENT_IMAGE_CARD_ID = "event-image";
export const EVENT_DOCUMENTS_CARD_ID = "event-documents";
// プレビューのイベント画像
export const EVENT_PREVIEW_IMAGE_ID = "event-preview-image";

// 入力の各項目と、プレビューで同じ内容を表示している項目の対応表（入力の並び順）。
// 対応先がどれも無いときはページ先頭へ移す。
export const EVENT_POST_PREVIEW_SCROLL_MAPPING: ScrollSyncMapping = [
  // タイトル・タグはプレビュー先頭のヘッダーに表示されるため、ページ先頭へ
  { sourceId: EVENT_TITLE_SECTION_ID, targetIds: [] },
  { sourceId: EVENT_TAGS_SECTION_ID, targetIds: [] },
  // 開催情報〜持ち物はプレビューではまとめて詳細表に表示される
  {
    sourceId: EVENT_SCHEDULE_SECTION_ID,
    targetIds: [EVENT_DETAIL_INFO_SECTION_ID],
  },
  {
    sourceId: EVENT_RECEPTION_SECTION_ID,
    targetIds: [EVENT_DETAIL_INFO_SECTION_ID],
  },
  { sourceId: EVENT_FEE_SECTION_ID, targetIds: [EVENT_DETAIL_INFO_SECTION_ID] },
  {
    sourceId: EVENT_ITEMS_SECTION_ID,
    targetIds: [EVENT_DETAIL_INFO_SECTION_ID],
  },
  // 画像が未設定だとプレビューに画像欄が無いため、画像が入るはずのヘッダー直下＝ページ先頭へ
  { sourceId: EVENT_IMAGE_CARD_ID, targetIds: [EVENT_PREVIEW_IMAGE_ID] },
  // 資料が未添付だとプレビューに添付資料欄が無いため、その直前にある詳細表へ
  {
    sourceId: EVENT_DOCUMENTS_CARD_ID,
    targetIds: [
      EVENT_DETAIL_ATTACHMENTS_SECTION_ID,
      EVENT_DETAIL_INFO_SECTION_ID,
    ],
  },
  {
    sourceId: EVENT_OVERVIEW_SECTION_ID,
    targetIds: [EVENT_DETAIL_OVERVIEW_SECTION_ID],
  },
];
