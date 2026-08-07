"use client";

import { EventStatusLabel } from "@/components/atoms/EventStatusLabel";
import { FilterTag } from "@/components/atoms/FilterTag";
import { Button } from "@/components/ui/button";
import type { TagItem } from "@/types/tag";
import { ROUTES } from "@/constants/routes";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type EventItem = {
  id: string;
  title: string;
  eventDate: string;
  endDate: string;
  location: string;
  profileId: string;
  hostName: string;
  hostAvatarUrl: string;
  tags?: TagItem[];
  status: "open" | "few_left" | "ended_registration" | "closed";
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

  const handleOrganizerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`${ROUTES.USERS}/${event.profileId}`);
  };

  const handleOrganizerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      router.push(`${ROUTES.USERS}/${event.profileId}`);
    }
  };

  const MAX_LOCATION_LENGTH = 12;
  const displayLocation =
    event.location.length > MAX_LOCATION_LENGTH
      ? `${event.location.slice(0, MAX_LOCATION_LENGTH)}......`
      : event.location;

  return (
    <a
      href={`/event/${event.id}`}
      aria-label={`${event.title} の詳細へ移動`}
      onClick={(e) => {
        e.preventDefault();
        router.push(`/event/${event.id}`);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/event/${event.id}`);
        }
      }}
      className="group relative flex w-full h-[132px] bg-white border border-[#E3E8DF] shadow-[0px_1px_2px_rgba(39,46,36,0.05),0px_4px_12px_rgba(39,46,36,0.06)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md no-underline"
    >
      {/* Left column: Date + Status */}
      <div className="flex flex-col items-center shrink-0 w-[129px]">
        {/* Date box: "8/11" + "火" */}
        <div className="mt-[21px] w-[78px] bg-white rounded-xl flex flex-col items-center pt-[2px] pb-[2px]">
          <span className="font-bold text-[32px] leading-[24px] text-[#171C15] text-center">
            {monthDay}
          </span>
          <span className="mt-[9px] text-base leading-[23px] text-black text-center">
            {weekday}
          </span>
        </div>

        {/* Status with equal gap */}
        <div className="w-[78px] flex justify-center mt-[9px]">
          <EventStatusLabel status={event.status} />
        </div>
      </div>

      {/* Vertical divider spans content area */}
      <div className="w-px h-[88px] bg-black mt-[21px] shrink-0" />

      {/* Right column: Tags / Title+Button / Location+Organizer */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Tags area with fixed height, empty space when no tags */}
        <div className="mt-[21px] h-[24px] ml-[26px] flex items-center">
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <FilterTag key={tag.id} label={tag.name} title={tag.name} />
              ))}
            </div>
          )}
        </div>

        {/* Title at card center y=66 */}
        <h3 className="mt-[7px] ml-[26px] pr-[186px] font-bold text-[19px] leading-[28px] text-[#272E24] line-clamp-1">
          {event.title}
        </h3>

        {/* Location + Organizer centered in lower space (y=66-132) */}
        <div className="relative flex items-center mt-[10px] ml-[26px]">
          <div className="flex items-center max-w-[175px] min-w-0">
            <MapPin className="h-[13px] w-[13px] text-[#5F8530] shrink-0" />
            <span className="ml-[6px] text-[13px] leading-[19px] text-[#667061] truncate">
              {displayLocation}
            </span>
          </div>
          <button
            type="button"
            className="absolute left-[288px] flex items-center cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none p-0"
            onClick={handleOrganizerClick}
            onKeyDown={handleOrganizerKeyDown}
            aria-label={`${event.hostName} のプロフィールへ移動`}
          >
            {event.hostAvatarUrl ? (
              <Image
                src={event.hostAvatarUrl}
                alt={`${event.hostName} のアバター`}
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
          </button>
        </div>

        {/* Detail button at y: 46 (center at 66) */}
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
    </a>
  );
}
