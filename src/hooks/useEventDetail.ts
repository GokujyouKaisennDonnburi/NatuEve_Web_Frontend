"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { getEventDetail } from "@/services/event";
import { getReport } from "@/services/report";
import type { ReportDetail } from "@/types/report";
import { useCallback, useEffect, useRef, useState } from "react";

// タブ復帰やアプリ切り替えで頻繁に再取得しないための最小間隔。
const MIN_REFETCH_INTERVAL_MS = 30_000;

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
// タブ復帰時と参加申し込み / キャンセル後の操作後にのみ最新化する。
export function useEventDetail(
  initialEvent: EventDetailType,
): UseEventDetailResult {
  const [event, setEvent] = useState(initialEvent);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const eventId = initialEvent.id;

  // アンマウント後の setState を避ける。refetch は effect の外からも呼ばれるため、
  // effect ローカルのフラグではなく ref でコンポーネントの寿命を持つ。
  const isMountedRef = useRef(true);
  // 取得の世代。タブ復帰時の再取得と参加操作後の再取得が競合したとき、
  // 先に始まって後から返ってきた結果で最新を上書きしないようにする。
  const requestIdRef = useRef(0);
  // 最後に再取得を開始した時刻。初回はマウント時刻として扱い、
  // 表示直後のタブ復帰で不要なリクエストを送らないようにする。
  const lastFetchedAtRef = useRef(Date.now());
  // 実行中のイベント詳細取得。再取得時とアンマウント時に中断する。
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  // 同じイベント ID のまま RSC が更新された場合も、サーバーの最新データへ同期する。
  // 同期前に実行中の再取得があれば中断し、古いレスポンスで上書きされないようにする。
  useEffect(() => {
    controllerRef.current?.abort();
    requestIdRef.current += 1;
    lastFetchedAtRef.current = Date.now();
    setEvent(initialEvent);
  }, [initialEvent]);

  const refetchEvent = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = ++requestIdRef.current;
    lastFetchedAtRef.current = Date.now();
    const isLatest = () =>
      isMountedRef.current && requestId === requestIdRef.current;

    try {
      const data = await getEventDetail(eventId, controller.signal);
      if (isLatest()) {
        setEvent(data);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      if (isLatest()) {
        console.error("イベント詳細再取得エラー", err);
      }
    }
  }, [eventId]);

  // タブ復帰・アプリ切り替え時に参加人数などを静かに最新化する。
  // visibilitychange はタブ切り替え、focus はアプリ切り替えを拾う。
  // 短時間に連続して発火しても、一定間隔内は再取得しない。
  useEffect(() => {
    const refetchIfStale = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchedAtRef.current < MIN_REFETCH_INTERVAL_MS) {
        return;
      }
      void refetchEvent();
    };

    window.addEventListener("focus", refetchIfStale);
    document.addEventListener("visibilitychange", refetchIfStale);
    return () => {
      window.removeEventListener("focus", refetchIfStale);
      document.removeEventListener("visibilitychange", refetchIfStale);
    };
  }, [refetchEvent]);

  // レポートは初期 HTML に必須ではないため、従来どおりクライアントで取得する。
  // 404 は「レポート未投稿」の正常系として null が返る。
  useEffect(() => {
    // id 変更時に前回のレポートをクリアして表示の取り違えを防ぐ
    setReport(null);
    let cancelled = false;
    const controller = new AbortController();

    const fetchReport = async (): Promise<void> => {
      try {
        const data = await getReport(eventId, controller.signal);
        if (!cancelled) setReport(data);
      } catch (err) {
        if (
          !cancelled &&
          !(err instanceof Error && err.name === "AbortError")
        ) {
          // レポート取得失敗はイベント表示を妨げない
          console.error("レポート取得エラー", err);
        }
      }
    };

    void fetchReport();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [eventId]);

  return { event, report, refetchEvent };
}
