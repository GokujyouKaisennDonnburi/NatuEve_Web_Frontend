"use client";

import { EventCard, type EventItem } from "@/components/EventCard";
import { TimelineHeader } from "@/components/organisms/TimelineHeader";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// API仕様に合わせて許可されているソートカラムを定義
type SortOption = "created_at" | "event_date";

// ▼ 変更: 新しいAPI仕様に合わせた型定義
type ApiResponseProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
};

type ApiResponseEvent = {
  createdAt: string;
  eventDate: string;
  id: string;
  location: string;
  profileId: string;
  title: string;
  profile: ApiResponseProfile; // ネストされたプロフィールオブジェクトを追加
};

type EventsApiResponse = {
  events: ApiResponseEvent[];
  limit: number;
  offset: number;
  totalCount: number;
};

// ▼ /api/v1/me のレスポンス型定義
type MeApiResponse = {
  avatarUrl: string;
  createdAt: string;
  displayName: string;
  email: string;
  id: string;
  updatedAt: string;
};

export default function EventListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const router = useRouter();

  // ▼ 独自ステートで認証状態を管理
  const [currentUser, setCurrentUser] = useState<MeApiResponse | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ▼ 本人プロフィール(ログイン状態)を取得する副作用
  useEffect(() => {
    let cancelled = false;

    const fetchMe = async () => {
      try {
        const res = await fetch("/api/v1/me");

        if (res.status === 401) {
          if (!cancelled) {
            setCurrentUser(null);
          }
          return;
        }

        if (!res.ok) {
          throw new Error(`プロフィール取得エラー (Status: ${res.status})`);
        }

        const data = (await res.json()) as MeApiResponse;
        if (!cancelled) {
          setCurrentUser(data);
        }
      } catch (err) {
        console.error("Me取得エラー:", err);
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    };

    void fetchMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateEvent = () => {
    if (isAuthLoading) {
      return;
    }
    if (!currentUser) {
      toast.error("イベントを投稿するにはログインしてください。");
      return;
    }
    router.push(ROUTES.EVENT_POST);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async (attempt = 0): Promise<void> => {
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const params = new URLSearchParams({
          sort: sortBy,
          order: "desc",
          limit: ITEMS_PER_PAGE.toString(),
          offset: offset.toString(),
        });

        const res = await fetch(`/api/v1/events?${params.toString()}`);

        if (!res.ok) {
          if (!cancelled && attempt < 5) {
            setTimeout(
              () => void fetchEvents(attempt + 1),
              200 * (attempt + 1),
            );
            return;
          }
          throw new Error(`データの取得に失敗しました (Status: ${res.status})`);
        }

        const data = (await res.json()) as EventsApiResponse;

        if (!cancelled) {
          // 新しいAPI構造からデータを適切に展開・マッピングします
          const mappedEvents: EventItem[] = data.events.map((apiEvent) => ({
            id: apiEvent.id,
            title: apiEvent.title,
            location: apiEvent.location,
            createdAt: apiEvent.createdAt,
            eventDate: apiEvent.eventDate,
            profileId: apiEvent.profileId,

            // APIから取得した主催者の情報をEventCardに引き渡せるように展開
            hostName: apiEvent.profile.displayName,
            hostAvatarUrl: apiEvent.profile.avatarUrl,

            // フロント側（UI）だけで必要な加工データ
            dateLabel: new Date(apiEvent.eventDate).toLocaleDateString(
              "ja-JP",
              {
                month: "short",
                day: "numeric",
              },
            ),
          }));

          setEvents(mappedEvents);
          setTotalCount(data.totalCount);
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
  }, [currentPage, sortBy]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const pageNumbers = useMemo(() => {
    const numbers: number[] = [];
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      if (i >= 1 && i <= totalPages) {
        numbers.push(i);
      }
    }
    return numbers;
  }, [currentPage, totalPages]);

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const dummySession = currentUser ? { user: currentUser } : null;
  const mappedUserForHeader = currentUser
    ? {
        name: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased selection:bg-emerald-100">
      <TimelineHeader
        eventCount={totalCount}
        isUserLoading={isAuthLoading}
        onCreateEvent={handleCreateEvent}
        session={dummySession as any}
        user={mappedUserForHeader as any}
      />

      <main className="mx-auto max-w-xl px-4 pt-4 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-4">
          <p className="text-xs text-slate-500 px-1">
            これから開催される自然観察イベントを縦にスクロールして確認できます。
          </p>

          <div className="flex items-center gap-1.5 self-end shrink-0 bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="text-xs font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="created_at">投稿が新しい順</option>
              <option value="event_date">開催日が近い順</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
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
          <div className="mt-8 flex items-center justify-center gap-1 px-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-none"
            >
              先頭
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-none"
            >
              前
            </Button>

            {pageNumbers.map((page) => (
              <Button
                key={page}
                size="xs"
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer shadow-none ${
                  currentPage === page
                    ? "bg-slate-950 text-white border-slate-950 hover:bg-slate-900"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-none"
            >
              次
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-none"
            >
              末尾
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
