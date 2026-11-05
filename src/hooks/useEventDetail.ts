"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { getEventDetail } from "@/services/event";
import { getReport } from "@/services/report";
import type { ReportDetail } from "@/types/report";
import { useCallback, useEffect, useRef, useState } from "react";

export type UseEventDetailResult = {
  // 表示するイベント詳細。SSR 時は initialEvent、再取得後は最新データ。
  event: EventDetailType;
  // 活動レポート。未取得・未投稿時は null。
  report: ReportDetail | null;
  // 参加人数などを再取得する。参加申し込み / キャンセル後に呼ぶ。
  refetchEvent: () => Promise<void>;
};

// イベント詳細ページのクライアント側状態を管理するフック。
// 初期 HTML はサーバーで描画済みのため、マウント時には再取得しない。
// フォーカス時と参加申し込み / キャンセル後の操作後にのみ最新化する。
export function useEventDetail(
  initialEvent: EventDetailType,
): UseEventDetailResult {
  const [event, setEvent] = useState(initialEvent);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const eventId = initialEvent.id;

  // アンマウント後の setState を避ける。refetch は effect の外からも呼ばれるため、
  // effect ローカルのフラグではなく ref でコンポーネントの寿命を持つ。
  const isMountedRef = useRef(true);
  // 取得の世代。フォーカス時の再取得と参加操作後の再取得が競合したとき、
  // 先に始まって後から返ってきた結果で最新を上書きしないようにする。
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetchEvent = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isLatest = () =>
      isMountedRef.current && requestId === requestIdRef.current;

    try {
      const data = await getEventDetail(eventId);
      if (isLatest()) {
        setEvent(data);
      }
    } catch (err) {
      if (isLatest()) {
        console.error("イベント詳細再取得エラー", err);
      }
    }
  }, [eventId]);

  // フォーカスが戻ったときに参加人数などを静かに最新化する。
  useEffect(() => {
    const refetchOnFocus = () => {
      void refetchEvent();
    };

    window.addEventListener("focus", refetchOnFocus);
    return () => {
      window.removeEventListener("focus", refetchOnFocus);
    };
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
