"use client"; // ソート（状態管理）を行うため Client Component に変更

import { EventCard, type EventItem } from "@/components/EventCard";
import { ArrowUpDown } from "lucide-react"; // ソート用のアイコン
import { useEffect, useMemo, useState } from "react"; // useEffect を追加

// 15件の生き物観察イベントのダミーデータ（ループで自動生成）
const DUMMY_EVENTS: EventItem[] = Array.from({ length: 15 }).map((_, index) => {
  const base = new Date(Date.UTC(2026, 5, 22 + index));
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  const isMorning = index % 2 === 0;

  return {
    id: String(index + 1),
    title: `${index % 3 === 0 ? "🦆" : index % 3 === 1 ? "🐟" : "🦋"} 森と水の生き物観察ハイク Vol.${index + 1}`,
    dateLabel: isMorning ? "朝の部" : "午後の部",
    startAt: `${yyyy}-${mm}-${dd}T${isMorning ? "10:00:00" : "14:00:00"}+09:00`,
    location:
      index % 2 === 0
        ? "青葉の森公園 (ネイチャーセンター前)"
        : "月見湖ビオトープ (東口集合)",
    host: index % 2 === 0 ? "ナチュビト公式" : "森の案内人・山田",
    postedAt: `${yyyy}-${mm}-${dd}T07:55:00+09:00`,
  };
});

// ソートの種類をここで一元管理（増えたらここに追加）
type SortOption = "postedAt_desc" /* | "startAt_asc" | "startAt_desc" */;

export default function EventListPage() {
  // データを保持するステートを定義（初期値は空配列）
  const [events, setEvents] = useState<EventItem[]>([]);
  // 現在選択されているソート条件を管理（初期値は投稿日時の降順）
  const [sortBy, setSortBy] = useState<SortOption>("postedAt_desc");

  // コンポーネント読み込み時に MSW からデータをフェッチする
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  }, []);

  // useMemoでソート結果をキャッシュ。sortByかデータが変わった時だけ再計算する
  const sortedEvents = useMemo(() => {
    // 元の DUMMY_EVENTS ではなく、フェッチした events をソート対象にする
    return [...events].sort((a, b) => {
      switch (sortBy) {
        case "postedAt_desc": // 投稿日時が新しい順（降順）
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
        
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