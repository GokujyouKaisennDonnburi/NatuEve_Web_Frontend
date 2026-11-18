"use client";

import { EmptyMessage } from "@/components/atoms/EmptyMessage";
import { EventFilterPill } from "@/components/atoms/EventFilterPill";
import { EventCard, type EventItem } from "@/components/organisms/EventCard";
import { useMemo, useState } from "react";

type UserEventTabsProps = {
  hostedEvents: EventItem[];
  participatedEvents: EventItem[];
  appliedEvents?: EventItem[];
  isOwnProfile: boolean;
  counts?: {
    hosted: number;
    participated: number;
    applied?: number;
  };
};

type TabKey = "applied" | "hosted" | "participated";

const TAB_LABELS: Record<TabKey, string> = {
  applied: "申し込み中イベント",
  hosted: "主催したイベント",
  participated: "参加済みイベント",
};

const TAB_SUB_TEXTS: Record<TabKey, { own: string; other: string }> = {
  applied: {
    own: "あなたが申し込み中のイベント",
    other: "このユーザーが申し込み中のイベント",
  },
  hosted: {
    own: "あなたが主催したイベント",
    other: "このユーザーが主催したイベント",
  },
  participated: {
    own: "あなたが参加したイベント",
    other: "このユーザーが参加したイベント",
  },
};

const ALL_TABS: TabKey[] = ["applied", "hosted", "participated"];

export function UserEventTabs({
  hostedEvents,
  participatedEvents,
  appliedEvents = [],
  isOwnProfile,
  counts,
}: UserEventTabsProps) {
  const tabs = useMemo(
    () =>
      isOwnProfile ? ALL_TABS : ALL_TABS.filter((key) => key !== "applied"),
    [isOwnProfile],
  );

  const [activeTab, setActiveTab] = useState<TabKey>(
    isOwnProfile ? "applied" : "hosted",
  );

  const eventMap: Record<TabKey, EventItem[]> = {
    applied: appliedEvents,
    hosted: hostedEvents,
    participated: participatedEvents,
  };

  const currentEvents = eventMap[activeTab];

  const getCount = (key: TabKey): number => {
    if (counts) {
      switch (key) {
        case "applied":
          return counts.applied ?? 0;
        case "hosted":
          return counts.hosted;
        case "participated":
          return counts.participated;
      }
    }
    return eventMap[key].length;
  };

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
        <h2 className="font-['Zen_Maru_Gothic'] font-bold text-[19px] leading-[28px] text-[#272E24]">
          {TAB_LABELS[activeTab]}
        </h2>
        <span className="text-[13px] leading-[19px] text-[#838C7D]">
          {isOwnProfile
            ? TAB_SUB_TEXTS[activeTab].own
            : TAB_SUB_TEXTS[activeTab].other}
        </span>
      </div>

      <div className="mt-4 space-y-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((key) => (
            <EventFilterPill
              key={key}
              label={TAB_LABELS[key]}
              count={getCount(key)}
              active={activeTab === key}
              onClick={() => setActiveTab(key)}
            />
          ))}
        </div>

        {currentEvents.length > 0 ? (
          <div className="space-y-4">
            {currentEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyMessage>イベントがありません。</EmptyMessage>
        )}
      </div>
    </div>
  );
}
