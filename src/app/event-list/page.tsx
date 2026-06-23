import { EventCard, type EventItem } from "@/components/EventCard";

// 15件の生き物観察イベントのダミーデータ（ループで自動生成）
const DUMMY_EVENTS: EventItem[] = Array.from({ length: 15 }).map((_, index) => {
  const day = index + 22;
  const isMorning = index % 2 === 0;
  return {
    id: String(index + 1),
    title: `${index % 3 === 0 ? "🦆" : index % 3 === 1 ? "🐟" : "🦋"} 森と水の生き物観察ハイク Vol.${index + 1}`,
    dateLabel: isMorning ? "朝の部" : "午後の部",
    startAt: `2026-06-${day}T${isMorning ? "10:00:00" : "14:00:00"}+09:00`,
    location: index % 2 === 0 ? "青葉の森公園 (ネイチャーセンター前)" : "月見湖ビオトープ (東口集合)",
    host: index % 2 === 0 ? "ナチュビト公式" : "森の案内人・山田",
    postedAt: `2026-06-${day}T07:55:00+09:00`,
  };
});

export default function EventListPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased selection:bg-emerald-100">
      {/* SNS風の固定ヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            <span className="text-xl">🌿</span> 生き物イベントタイムライン
          </h1>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {DUMMY_EVENTS.length} 件のイベント
          </span>
        </div>
      </header>

      {/* タイムラインメインコンテンツ */}
      <main className="mx-auto max-w-xl px-4 pt-4 pb-16">
        <p className="text-xs text-slate-500 mb-4 px-1 text-center md:text-left">
          これから開催される自然観察イベントを縦にスクロールして確認できます。
        </p>
        
        {/* カードを縦に並べるタイムラインコンテナ */}
        <div className="space-y-4">
          {DUMMY_EVENTS.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </main>
    </div>
  );
}