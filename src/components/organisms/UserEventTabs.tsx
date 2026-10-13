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

const ALL_TABS: { key: TabKey; label: string }[] = [
  { key: "applied", label: "申し込み中イベント" },
  { key: "hosted", label: "主催したイベント" },
  { key: "participated", label: "参加済みイベント" },
];

export function UserEventTabs({
  hostedEvents,
  participatedEvents,
  appliedEvents = [],
  isOwnProfile,
  counts,
}: UserEventTabsProps) {
  const tabs = useMemo(
    () =>
      isOwnProfile ? ALL_TABS : ALL_TABS.filter((t) => t.key !== "applied"),
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
    <div className="min-w-0 w-full space-y-6">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ key, label }) => (
          <EventFilterPill
            key={key}
            label={label}
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
  );
}
