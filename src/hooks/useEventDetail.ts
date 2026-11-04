"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { getEventDetail } from "@/services/event";
import { getReport } from "@/services/report";
import type { ReportDetail } from "@/types/report";
import { useCallback, useEffect, useState } from "react";

export type UseEventDetailResult = {
  // 表示するイベント詳細。SSR 時は initialEvent、再取得後は最新データ。
  event: EventDetailType;
  // 活動レポート。未取得・未投稿時は null。
  report: ReportDetail | null;
  // 参加人数などを再取得する。参加申し込み / キャンセル後に呼ぶ。
  refetchEvent: () => Promise<void>;
};

// イベント詳細ページのクライアント側状態を管理するフック。
// 初期 HTML はサーバーで描画済みのため、初回マウント時はローディングを出さずに
// 参加人数などの変わりやすい値を静かに最新化する。
export function useEventDetail(
  initialEvent: EventDetailType,
): UseEventDetailResult {
  const [event, setEvent] = useState(initialEvent);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const eventId = initialEvent.id;

  const refetchEvent = useCallback(async () => {
    try {
      const data = await getEventDetail(eventId);
      setEvent(data);
    } catch (err) {
      console.error("イベント詳細再取得エラー", err);
    }
  }, [eventId]);

  // 初回マウント時にクライアント側で最新化する（ローディング表示は出さない）。
  useEffect(() => {
    void refetchEvent();
  }, [refetchEvent]);

  // レポートは初期 HTML に必須ではないため、従来どおりクライアントで取得する。
  // 404 は「レポート未投稿」の正常系として null が返る。
  useEffect(() => {
    // id 変更時に前回のレポートをクリアして表示の取り違えを防ぐ
    setReport(null);
    let cancelled = false;

    const fetchReport = async (): Promise<void> => {
      try {
        const data = await getReport(eventId);
        if (!cancelled) setReport(data);
      } catch (err) {
        // レポート取得失敗はイベント表示を妨げない
        console.error("レポート取得エラー", err);
      }
    };

    void fetchReport();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { event, report, refetchEvent };
}
