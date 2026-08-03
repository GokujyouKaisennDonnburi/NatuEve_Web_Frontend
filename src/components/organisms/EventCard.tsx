"use client";

import { EventStatusLabel } from "@/components/atoms/EventStatusLabel";
import { FilterTag } from "@/components/atoms/FilterTag";
import { Button } from "@/components/ui/button";
import type { TagItem } from "@/types/tag";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type EventItem = {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  profileId: string;
  hostName: string;
  hostAvatarUrl: string;
  tags?: TagItem[];
  status: "open" | "few_left" | "closed";
};

type EventCardProps = {
  event: EventItem;
};

export function EventCard({ event }: Readonly<EventCardProps>) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const router = useRouter();

  if (!isMounted) {
    return (
      <div className="w-full h-[132px] bg-slate-100 rounded-2xl animate-pulse" />
    );
  }

  const start = new Date(event.eventDate);
  const monthDay = start.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const weekday = start.toLocaleDateString("ja-JP", {
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });

  return (
    <div
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
      className="group relative flex w-full h-[132px] bg-white border border-[#E3E8DF] shadow-[0px_1px_2px_rgba(39,46,36,0.05),0px_4px_12px_rgba(39,46,36,0.06)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Left section: Date + Status */}
      <div className="relative flex flex-col items-center shrink-0 w-[155px]">
        <div className="absolute left-[129px] top-[11px] w-px h-[108px] bg-black" />

        <div className="mt-[18px] w-[78px] h-[73px] bg-white rounded-xl flex flex-col items-center pt-[3px]">
          <span className="font-bold text-[32px] leading-[24px] text-[#171C15] text-center">
            {monthDay}
          </span>
          <span className="mt-[9px] text-base leading-[23px] text-black text-center">
            {weekday}
          </span>
        </div>

        <div className="w-[78px] flex justify-center mt-[3px]">
          <EventStatusLabel status={event.status} />
        </div>
      </div>

      {/* Right section: Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Categories at y: 23 */}
        <div className="pt-[23px]">
          <div className="flex flex-wrap gap-1">
            {event.tags?.map((tag) => (
              <FilterTag key={tag.id} label={tag.name} title={tag.name} />
            ))}
          </div>
        </div>

        {/* Title at y: 52 */}
        <h3 className="mt-[5px] pr-[160px] font-bold text-[19px] leading-[28px] text-[#272E24] line-clamp-1">
          {event.title}
        </h3>

        {/* Location + Organizer at y: 87 */}
        <div className="flex items-center mt-[8px]">
          <div className="flex items-center ml-[3px]">
            <MapPin className="h-[13px] w-[13px] text-[#5F8530] shrink-0" />
            <span className="ml-[6px] text-[13px] leading-[19px] text-[#667061]">
              {event.location}
            </span>
          </div>
          <div className="flex items-center ml-[113px]">
            {event.hostAvatarUrl ? (
              <Image
                src={event.hostAvatarUrl}
                alt=""
                width={18}
                height={16}
                className="h-4 w-[18px] rounded-full object-cover"
              />
            ) : (
              <div className="h-4 w-[18px] rounded-full bg-[#EADDFF] flex items-center justify-center">
                <div className="w-[70%] h-[65%] bg-[#4F378A] rounded-full" />
              </div>
            )}
            <span className="ml-1 text-[13px] leading-[19px] text-[#667061]">
              {event.hostName}
            </span>
          </div>
        </div>

        {/* Detail button - absolute positioned at y: 46 */}
        <Button
          type="button"
          className="absolute right-[25px] top-[46px] w-[114px] h-10 bg-[#97C459] hover:bg-[#97C459]/90 rounded-full text-sm font-bold leading-5 text-[#1E2C10]"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/event/${event.id}`);
          }}
        >
          詳細を見る
        </Button>
      </div>
    </div>
  );
}