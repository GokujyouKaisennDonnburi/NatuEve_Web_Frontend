import { EmptyMessage } from "@/components/atoms/EmptyMessage";
import { EventCard, type EventItem } from "@/components/EventCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserEventTabsProps = {
  hostedEvents: EventItem[];
  participatedEvents: EventItem[];
};

export function UserEventTabs({
  hostedEvents,
  participatedEvents,
}: UserEventTabsProps) {
  return (
    <Tabs defaultValue="hosted" className="w-full">
      {/* タブの切り替えボタン */}
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="hosted" className="text-sm">
          主催したイベント
        </TabsTrigger>
        <TabsTrigger value="participated" className="text-sm">
          参加したイベント
        </TabsTrigger>
      </TabsList>

      {/* 主催イベントのリスト */}
      <TabsContent value="hosted" className="mt-6 space-y-4">
        {hostedEvents.length > 0 ? (
          hostedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <EmptyMessage>主催したイベントはありません。</EmptyMessage>
        )}
      </TabsContent>

      {/* 参加イベントのリスト */}
      <TabsContent value="participated" className="mt-6 space-y-4">
        {participatedEvents.length > 0 ? (
          participatedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <EmptyMessage>参加したイベントはありません。</EmptyMessage>
        )}
      </TabsContent>
    </Tabs>
  );
}
