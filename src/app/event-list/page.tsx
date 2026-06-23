"use client"; // ソート（状態管理）を行うため Client Component に変更

import { ArrowUpDown } from "lucide-react"; // ソート用のアイコン
import { useEffect, useMemo, useState } from "react"; // useEffect を追加
import { EventCard, type EventItem } from "@/components/EventCard";

// ソートの種類をここで一元管理（増えたらここに追加）
type SortOption = "postedAt_desc" /* | "startAt_asc" | "startAt_desc" */;

export default function EventListPage() {
  // データを保持するステートを定義（初期値は空配列）
  const [events, setEvents] = useState<EventItem[]>([]);
  // 現在選択されているソート条件を管理（初期値は投稿日時の降順）
  const [sortBy, setSortBy] = useState<SortOption>("postedAt_desc");

  // MSWの準備完了を待ってからフェッチする
  useEffect(() => {
    let cancelled = false;
    const fetchEvents = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch("/api/events");

        // エラー画面（HTML）を掴まされた場合にJSONパースエラーでクラッシュするのを防ぐ
        if (!res.ok) {
          throw new Error(`データの取得に失敗しました (Status: ${res.status})`);
        }

        const data = (await res.json()) as EventItem[];
        if (!cancelled) setEvents(data);
      } catch (err) {
        // MSW の起動タイミングによっては最初のリクエストが素通りすることがあるため、数回だけリトライする
        if (!cancelled && attempt < 5) {
          setTimeout(() => void fetchEvents(attempt + 1), 200 * (attempt + 1));
          return;
        }

        console.error("Fetchエラー:", err);
      }
    };

    void fetchEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  // useMemoでソート結果をキャッシュ。sortByかデータが変わった時だけ再計算する
  const sortedEvents = useMemo(() => {
    // 元の DUMMY_EVENTS ではなく、フェッチした events をソート対象にする
    return [...events].sort((a, b) => {
      switch (sortBy) {
        case "postedAt_desc": // 投稿日時が新しい順（降順）
          return (
            new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          );

        // 今後ソートを追加する場合は、ここに case を足す 例：
        // case "startAt_asc": // 開催日時が近い順（昇順）
        //   return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();

        default:
          return 0; // そのまま
      }
    });
  }, [events, sortBy]); // 変更点4: 依存配列に events を追加

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased selection:bg-emerald-100">
      {/* SNS風の固定ヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            <span className="text-xl">🌿</span> 生き物イベントタイムライン
          </h1>
          {/* 変更点5: 件数表示もフェッチしたデータ（events）の数に連動させる */}
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {events.length} 件のイベント
          </span>
        </div>
      </header>

      {/* タイムラインメインコンテンツ */}
      <main className="mx-auto max-w-xl px-4 pt-4 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-4">
          <p className="text-xs text-slate-500 px-1">
            これから開催される自然観察イベントを縦にスクロールして確認できます。
          </p>

          {/* ソート切り替えUI（セレクトボックス） */}
          <div className="flex items-center gap-1.5 self-end shrink-0 bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="postedAt_desc">投稿が新しい順</option>
              {/* 今後追加する場合はここをコメントアウト解除して増やす */}
              {/* <option value="startAt_asc">開催が近い順</option> */}
            </select>
          </div>
        </div>

        {/* カードを縦に並べるタイムラインコンテナ */}
        <div className="space-y-4">
          {/* 生の DUMMY_EVENTS ではなく、ソート済みの sortedEvents を展開する */}
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </main>
    </div>
  );
}
