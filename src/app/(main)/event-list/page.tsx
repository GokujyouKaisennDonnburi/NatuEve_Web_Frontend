"use client";

import { CreateEventButton } from "@/components/atoms/CreateEventButton";
import { SortButton } from "@/components/atoms/SortButton";
import { SearchBar } from "@/components/molecules/SearchBar";
import { Pagination } from "@/components/molecules/Pagination";
import { EventCard, type EventItem } from "@/components/organisms/EventCard";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchEventList } from "@/services/event";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SortOption = "created_at" | "event_date";

export default function EventListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 15;

  const router = useRouter();

  // Supabaseのセッション状態を取得
  const { session, isLoading: isSessionLoading } = useAuth();

  // 現在のユーザー情報を取得（Service経由）
  const { user: currentUser, isLoading: isProfileLoading } =
    useCurrentUser(session);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async (attempt = 0): Promise<void> => {
      if (cancelled) return;

      // セッションがロード中の場合は待機
      if (isSessionLoading) return;

      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const order = sortBy === "event_date" ? "asc" : "desc";

        // 検索クエリがある場合は半角/全角スペースで分割し、
        // 各キーワードを q パラメータとして多重送信する（AND 検索）
        // swagger 仕様に基づき最大10語までとする
        let keywords: string[] | undefined;
        if (searchQuery) {
          keywords = searchQuery
            .split(/[\s\u3000]+/)
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
            .slice(0, 10);
          if (keywords.length === 0) keywords = undefined;
        }

        // Service を経由してイベント一覧を取得
        const data = await fetchEventList({
          sort: sortBy,
          order,
          limit: ITEMS_PER_PAGE,
          offset,
          keywords,
        });

        if (!cancelled) {
          // キャンセル済みイベント(cancelledAt が設定済み)は一覧から除外する。
          // MSW は API 側で除外済みだが、実 API はキャンセル済みも返すため
          // クライアント側で表示と件数を制御する。
          const visibleApiEvents = data.events.filter(
            (apiEvent) => apiEvent.cancelledAt == null,
          );

          const mappedEvents: EventItem[] = visibleApiEvents.map(
            (apiEvent) => ({
              id: apiEvent.id,
              title: apiEvent.title,
              location: apiEvent.location,
              eventDate: apiEvent.eventDate,
              profileId: apiEvent.profileId,
              hostName: apiEvent.profile?.displayName ?? "名無しのゲンゴロウ",
              hostAvatarUrl: apiEvent.profile?.avatarUrl ?? "",
              tags: apiEvent.tags,
              status:
                new Date(apiEvent.eventDate) < new Date() ? "closed" : "open",
            }),
          );

          setEvents(mappedEvents);
          // 件数は API の totalCount から当ページに含まれるキャンセル済み件数を引く
          setTotalCount(
            data.totalCount - (data.events.length - visibleApiEvents.length),
          );
        }
      } catch (err) {
        if (!cancelled && attempt < 5) {
          setTimeout(() => void fetchEvents(attempt + 1), 200 * (attempt + 1));
          return;
        }
        console.error("Fetchエラー:", err);
      }
    };

    void fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [currentPage, sortBy, searchQuery, isSessionLoading]); // 依存配列に loading 状態を追加

  const handleCreateEvent = () => {
    if (isSessionLoading || isProfileLoading) {
      return;
    }
    if (!currentUser) {
      toast.error("イベントを投稿するにはログインしてください。");
      return;
    }
    router.push(ROUTES.EVENT_POST);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "event_date", label: "開催日が近い順" },
    { value: "created_at", label: "投稿が新しい順" },
  ];

  // ソートオプションの変更を処理する関数
  const handleSortChange = (value: string) => {
    const validSortOptions = ["event_date", "created_at"] as const;
    if (!validSortOptions.includes(value as (typeof validSortOptions)[number]))
      return;
    setSortBy(value as SortOption);
    setCurrentPage(1);
  };

  // 検索クエリの変更を処理する関数
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-8 py-8">
      {/* Title */}
      <h1 className="text-[40px] leading-[58px] text-black font-normal mb-8">
        イベントを探す
      </h1>

      {/* Search + Sort row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 max-w-[1126px]">
          <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
        </div>
        <div className="shrink-0 pt-[23px]">
          <SortButton
            label="並び替え"
            options={sortOptions}
            value={sortBy}
            onChange={handleSortChange}
          />
        </div>
      </div>

      {/* Event count + Create button */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {totalCount} 件のイベント
        </span>
        <CreateEventButton
          type="button"
          onClick={handleCreateEvent}
          aria-label="イベントを投稿"
        />
      </div>

      {/* Event cards */}
      <div className="space-y-[48px]">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">
            表示するイベントがありません。
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
