"use client";

import { EventFilterPill } from "@/components/atoms/EventFilterPill";
import { EmptyMessage } from "@/components/atoms/EmptyMessage";
import { EventCard, type EventItem } from "@/components/organisms/EventCard";
import { useState } from "react";

type UserEventTabsProps = {
  hostedEvents: EventItem[];
  participatedEvents: EventItem[];
  appliedEvents: EventItem[];
};

type TabKey = "applied" | "hosted" | "participated";

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "applied", label: "申し込み中イベント" },
  { key: "hosted", label: "主催したイベント" },
  { key: "participated", label: "参加済みイベント" },
];

export function UserEventTabs({
  hostedEvents,
  participatedEvents,
  appliedEvents,
}: UserEventTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("hosted");

  const eventMap: Record<TabKey, EventItem[]> = {
    applied: appliedEvents,
    hosted: hostedEvents,
    participated: participatedEvents,
  };

  const currentEvents = eventMap[activeTab];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap gap-2">
        {TAB_CONFIG.map(({ key, label }) => (
          <EventFilterPill
            key={key}
            label={label}
            count={eventMap[key].length}
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