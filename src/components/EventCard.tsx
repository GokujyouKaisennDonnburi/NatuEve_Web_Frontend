"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, User } from "lucide-react";
import { useEffect, useState } from "react";

export type EventItem = {
  id: string;
  title: string;
  dateLabel: string;
  startAt: string;
  location: string;
  host: string;
  postedAt: string;
};

type EventCardProps = {
  event: EventItem;
};

export function EventCard({ event }: EventCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  // ローディングの高さも実際のカードの高さに合わせて調整
  if (!isMounted) return <div className="w-full h-[76px] bg-slate-100 rounded-lg animate-pulse" />;

  const start = new Date(event.startAt);
  const formattedDate = start.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  const formattedTime = start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="group relative w-full overflow-hidden border border-slate-200/80 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-200 cursor-pointer">
      {/* 左端のアクセントライン */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 opacity-90" />
      
      {/* shadcn独自の隠れ余白を強制リセット（!p-0）し、自前のdiv（p-3）で12pxの均等余白を再現 */}
      <CardContent className="!p-0">
        <div className="p-3 pl-4 flex flex-col gap-3">
          
          {/* 1行目：メタ情報 */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 leading-none">
            <div className="flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {event.dateLabel}
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-500">
                <User className="h-2.5 w-2.5 text-slate-400" />
                {event.host}
              </span>
            </div>
            <span className="text-[9px] font-medium tracking-wider text-emerald-600/80">TL EVENT</span>
          </div>

          {/* 2行目：タイトル */}
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-200 leading-none line-clamp-1">
            {event.title}
          </h3>

          {/* 3行目：日時 ＆ 場所 */}
          <div className="flex flex-row items-center gap-x-4 text-[11px] text-slate-500 leading-none">
            {/* 日付 */}
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="h-3 w-3 text-sky-400 shrink-0" />
              <span className="font-semibold text-slate-700">{formattedDate}</span>
              <span>{formattedTime}〜</span>
            </div>
            {/* 場所 */}
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="truncate text-slate-600">{event.location}</span>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}