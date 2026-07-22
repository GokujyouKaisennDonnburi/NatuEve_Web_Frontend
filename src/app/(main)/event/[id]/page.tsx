"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import EventDetail from "@/components/organisms/EventDetail";
import { getReport } from "@/services/report";
import type { ReportDetail } from "@/types/report";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// イベント詳細ページコンポーネント
export default function EventDetailPage() {
  const params = useParams(); // URLパラメータからイベントIDを取得
  const id = params?.id as string; // イベントIDを文字列として型アサーション

  const [event, setEvent] = useState<EventDetailType | null>(null); // イベント詳細データを保持するステート
  const [report, setReport] = useState<ReportDetail | null>(null); // レポートデータを保持するステート
  const [loading, setLoading] = useState(true);

  // イベント詳細データを取得する副作用フック
  useEffect(() => {
    // イベントIDが存在しない場合は何もしない
    if (!id) return;

    // キャンセルフラグを設定して、コンポーネントがアンマウントされた場合に状態更新を防ぐ
    let cancelled = false;

    // イベント詳細データを取得する非同期関数
    const fetchDetail = async (attempt = 0): Promise<void> => {
      setLoading(true);
      let shouldKeepLoading = false;

      // fetch APIを使用してイベント詳細データを取得
      try {
        // APIエンドポイントにリクエストを送信
        const res = await fetch(`/api/v1/events/${id}`);
        if (!res.ok) {
          if (!cancelled && attempt < 5) {
            shouldKeepLoading = true;
            setTimeout(
              () => void fetchDetail(attempt + 1),
              200 * (attempt + 1),
            );
            return;
          }

          throw new Error(`status:${res.status}`);
        }

        // レスポンスをJSONとしてパースし、イベント詳細データを取得
        const data = (await res.json()) as EventDetailType;
        if (!cancelled) setEvent(data);
      } catch (err) {
        if (!cancelled && attempt < 5) {
          shouldKeepLoading = true;
          setTimeout(() => void fetchDetail(attempt + 1), 200 * (attempt + 1));
          return;
        }

        console.error("イベント詳細取得エラー", err);
      } finally {
        if (!cancelled && !shouldKeepLoading) setLoading(false);
      }
    };

    void fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // レポートデータを取得する副作用フック
  // 認証不要・1イベント1レポート。404 は「レポート未投稿」の正常系として扱う。
  useEffect(() => {
    if (!id) return;

    // id 変更時に前回のレポートをクリアして表示の取り違えを防ぐ
    setReport(null);
    let cancelled = false;

    const fetchReport = async (): Promise<void> => {
      try {
        const data = await getReport(id);
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
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <div>読み込み中…</div>
      </div>
    );

  // イベントが見つからない場合の表示
  if (!event)
    return (
      <div className="flex items-center justify-center py-16">
        <div>イベントが見つかりません。</div>
      </div>
    );

  return (
    // イベント詳細ページのメインコンテンツ
    <div className="mx-auto max-w-4xl">
      <EventDetail event={event} report={report} />
    </div>
  );
}
