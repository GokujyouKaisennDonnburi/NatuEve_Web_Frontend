"use client";

import { Badge } from "@/components/atoms/Badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type EventItem = {
  id: string;
  title: string;
  dateLabel: string;
  eventDate: string;
  location: string;
  profileId: string;
  createdAt: string;
  hostName: string;
  hostAvatarUrl: string;
  tags?: string[];
};

type EventCardProps = {
  event: EventItem;
};

export function EventCard({ event }: EventCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const router = useRouter();
  // ローディングの高さも実際のカードの高さに合わせて調整
  if (!isMounted)
    return (
      <div className="w-full h-19 bg-slate-100 rounded-lg animate-pulse" />
    );

  const start = new Date(event.eventDate);
  const formattedDate = start.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const formattedTime = start.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  const posted = new Date(event.createdAt);
  const formattedPostedAt = `${posted.getMonth() + 1}/${posted.getDate()} ${String(
    posted.getHours(),
  ).padStart(2, "0")}:${String(posted.getMinutes()).padStart(2, "0")}`;

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`${event.title} の詳細へ移動`}
      onClick={() => router.push(`/event/${event.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/event/${event.id}`);
        }
      }}
      className="group relative w-full overflow-hidden border border-slate-200/80 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-200 cursor-pointer"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-emerald-400 to-teal-400 opacity-90" />

      <CardContent className="p-0!">
        <div className="py-0 pr-3 pl-4 flex flex-col gap-1">
          {/* 1行目：メタ情報 */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 leading-none">
            <div className="flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {event.dateLabel}
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-500">
                {/* アバター画像があれば表示し、なければデフォルトのUserアイコンを表示 */}
                {event.hostAvatarUrl ? (
                  <Image
                    src={event.hostAvatarUrl}
                    alt=""
                    width={12}
                    height={12}
                    className="h-3 w-3 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-2.5 w-2.5 text-slate-400" />
                )}
                {event.hostName}
              </span>
            </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end ml-2">
              {event.tags.map((tag) => (
                <Badge
                  key={tag}
                  tone="subtle"
                  className="max-w-[6rem] truncate text-[10px] px-1.5 py-0.5 leading-none"
                  title={tag}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
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
              <span className="font-semibold text-slate-700">
                {formattedDate}
              </span>
              <span>{formattedTime}〜</span>
            </div>
            {/* 場所 */}
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="truncate text-slate-600">{event.location}</span>
            </div>
            {/* 投稿日 */}
            <div className="text-slate-500 shrink-0 ml-auto font-medium text-right leading-none">
              <span>投稿日時：{formattedPostedAt}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
