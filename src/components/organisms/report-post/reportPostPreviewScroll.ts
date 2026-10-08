// 入力→プレビュー切替時に、入力で見ていた項目に対応する所をプレビューで表示するための定義。
import {
  EVENT_REPORT_IMAGES_SECTION_ID,
  EVENT_REPORT_PDFS_SECTION_ID,
} from "@/components/molecules/event-detail/eventReportSections";
import type { ScrollSyncMapping } from "@/utils/scrollSync";

// 入力のカード（レポート内容・画像・PDF）
export const REPORT_CONTENT_CARD_ID = "report-content-card";
export const REPORT_IMAGES_CARD_ID = "report-images-card";
export const REPORT_PDFS_CARD_ID = "report-pdfs-card";
// プレビューの活動レポート（通常のカード・外部URLのカードのどちらも含む）
export const REPORT_PREVIEW_REPORT_ID = "report-preview-report";

// 入力の各カードと、プレビューで同じ内容を表示している所の対応表（入力の並び順）。
// 上の「対象イベント」は入力・プレビューで共通の位置に表示されるため対象にしない
// （そこを見ているときは見ている項目が無い扱いになり、位置を変えない）。
export const REPORT_POST_PREVIEW_SCROLL_MAPPING: ScrollSyncMapping = [
  // 外部URL・活動記録は、プレビューの活動レポートのカードに表示される
  { sourceId: REPORT_CONTENT_CARD_ID, targetIds: [REPORT_PREVIEW_REPORT_ID] },
  // 画像が未添付だとプレビューに画像欄が無いため、活動レポートのカードへ
  {
    sourceId: REPORT_IMAGES_CARD_ID,
    targetIds: [EVENT_REPORT_IMAGES_SECTION_ID, REPORT_PREVIEW_REPORT_ID],
  },
  // PDF が未添付だとプレビューに PDF 欄が無いため、その直前にある画像欄、
  // それも無ければ活動レポートのカードへ
  {
    sourceId: REPORT_PDFS_CARD_ID,
    targetIds: [
      EVENT_REPORT_PDFS_SECTION_ID,
      EVENT_REPORT_IMAGES_SECTION_ID,
      REPORT_PREVIEW_REPORT_ID,
    ],
  },
];
