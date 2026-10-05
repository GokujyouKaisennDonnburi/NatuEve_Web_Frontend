"use client";

import { EventStatusLabel } from "@/components/atoms/EventStatusLabel";
import { FilterTag } from "@/components/atoms/FilterTag";
import { Button } from "@/components/ui/button";
import type { TagItem } from "@/types/tag";
import type { ResolvedEventStatus } from "@/utils/eventStatus";
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
  status: ResolvedEventStatus;
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
      <div className="h-[250px] w-full animate-pulse rounded-2xl bg-slate-100 sm:h-[132px]" />
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
      className="group relative flex min-h-[250px] w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E3E8DF] bg-white p-4 no-underline shadow-[0px_1px_2px_rgba(39,46,36,0.05),0px_4px_12px_rgba(39,46,36,0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md sm:h-[132px] sm:min-h-0 sm:flex-row sm:p-0"
    >
      {/* Left column: Date + Status */}
      <div className="flex w-full shrink-0 items-center gap-3 sm:w-[129px] sm:flex-col sm:gap-0">
        {/* Date box: "8/11" + "火" */}
        <div className="flex w-auto items-baseline gap-2 rounded-xl bg-white py-[2px] sm:mt-[21px] sm:w-[78px] sm:flex-col sm:items-center sm:gap-0">
          <span className="text-center text-[24px] font-bold leading-7 text-[#171C15] sm:text-[32px] sm:leading-[24px]">
            {monthDay}
          </span>
          <span className="text-center text-base leading-[23px] text-black sm:mt-[9px]">
            {weekday}
          </span>
        </div>

        {/* Status with equal gap */}
        <div className="flex w-auto justify-center sm:mt-[9px] sm:w-[78px]">
          <EventStatusLabel status={event.status} />
        </div>
      </div>

      {/* Vertical divider spans content area */}
      <div className="mt-3 h-px w-full shrink-0 bg-black sm:mt-[21px] sm:h-[88px] sm:w-px" />

      {/* Right column: Tags / Title+Button / Location+Organizer */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Tags area with fixed height, empty space when no tags */}
        <div className="mt-3 flex min-h-6 items-center sm:ml-[26px] sm:mt-[21px] sm:h-[24px]">
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <FilterTag key={tag.id} label={tag.name} title={tag.name} />
              ))}
            </div>
          )}
        </div>

        {/* Title at card center y=66 */}
        <h3 className="mt-2 line-clamp-2 text-[18px] font-bold leading-7 text-[#272E24] sm:ml-[26px] sm:mt-[7px] sm:line-clamp-1 sm:pr-[186px] sm:text-[19px]">
          {event.title}
        </h3>

        {/* Location + Organizer centered in lower space (y=66-132) */}
        <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:ml-[26px] sm:mt-[10px] sm:flex-nowrap sm:gap-0">
          <div className="flex min-w-0 max-w-full items-center sm:max-w-[175px]">
            <MapPin className="h-[13px] w-[13px] text-[#5F8530] shrink-0" />
            <span className="ml-[6px] inline-block max-w-[220px] truncate text-[13px] leading-[19px] text-[#667061] sm:max-w-[156px]">
              {displayLocation}
            </span>
          </div>
          <button
            type="button"
            className="flex min-w-0 cursor-pointer items-center border-none bg-transparent p-0 transition-opacity hover:opacity-70 sm:absolute sm:left-[180px]"
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
            <span className="ml-1 max-w-[160px] truncate text-[13px] leading-[19px] text-[#667061]">
              {event.hostName}
            </span>
          </button>
        </div>

        {/* Detail button at y: 46 (center at 66) */}
        <Button
          type="button"
          className="static mt-4 h-10 w-full rounded-full bg-[#97C459] text-sm font-bold leading-5 text-[#1E2C10] hover:bg-[#97C459]/90 sm:absolute sm:right-[25px] sm:top-[46px] sm:mt-0 sm:w-[114px]"
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
