// src/mocks/handlers/events.ts
import { http, HttpResponse } from 'msw';

const DUMMY_EVENTS = Array.from({ length: 15 }).map((_, index) => {
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
    location: index % 2 === 0 ? "青葉の森公園 (ネイチャーセンター前)" : "月見湖ビオトープ (東口集合)",
    host: index % 2 === 0 ? "ナチュビト公式" : "森の案内人・山田",
    postedAt: `${yyyy}-${mm}-${dd}T07:55:00+09:00`,
  };
});

export const eventHandlers = [
  http.get('/api/events', () => {
    return HttpResponse.json(DUMMY_EVENTS);
  }),
];