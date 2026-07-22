"use client";

import { CreateEventButton } from "@/components/atoms/CreateEventButton";
import { EventCard, type EventItem } from "@/components/EventCard";
import { EventSearchBar } from "@/components/molecules/EventSearchBar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SortOption = "created_at" | "event_date";

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
  profile: ApiResponseProfile;
  tags?: Array<{ id: string; name: string }>;
  // イベントが取りやめになった日時(RFC3339)。未設定(null/undefined)の場合は開催予定。
  cancelledAt?: string | null;
};

type EventsApiResponse = {
  events: ApiResponseEvent[];
  limit: number;
  offset: number;
  totalCount: number;
};

type MeApiResponse = {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
};

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

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // sessionのトークンを使って /api/v1/me を叩く
  useEffect(() => {
    let cancelled = false;

    const fetchMe = async () => {
      // セッション自体がロード中の場合は待機
      if (isSessionLoading) return;

      // セッションがない（未ログイン）場合はAPIを叩かず終了
      if (!session?.token) {
        if (!cancelled) {
          setCurrentUser(null);
          setIsProfileLoading(false);
        }
        return;
      }

      try {
        // Authorization ヘッダーに Bearer トークンを付与
        const res = await fetch("/api/v1/me", {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        if (res.status === 401) {
          if (!cancelled) setCurrentUser(null);
          return;
        }

        if (!res.ok) {
          throw new Error(`プロフィール取得エラー (Status: ${res.status})`);
        }

        const data = (await res.json()) as MeApiResponse;
        if (!cancelled) {
          setCurrentUser({
            id: data.id,
            email: data.email,
            displayName: data.displayName ?? data.display_name ?? "",
            avatarUrl: data.avatarUrl ?? data.avatar_url ?? "",
            createdAt: data.createdAt ?? data.created_at ?? "",
            updatedAt: data.updatedAt ?? data.updated_at ?? "",
          });
        }
      } catch (err) {
        console.error("Me取得エラー:", err);
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsProfileLoading(false);
        }
      }
    };

    void fetchMe();
    return () => {
      cancelled = true;
    };
  }, [session, isSessionLoading]); // 依存配列に session と isSessionLoading を追加

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

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async (attempt = 0): Promise<void> => {
      if (cancelled) return;

      // セッションがロード中の場合は待機
      if (isSessionLoading) return;

      // セッションの有無で Authorization ヘッダーを切り替える（未ログインでも一覧取得は行う）
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const order = sortBy === "event_date" ? "asc" : "desc";
        const params = new URLSearchParams({
          sort: sortBy,
          order,
          limit: ITEMS_PER_PAGE.toString(),
          offset: offset.toString(),
        });

        // 検索クエリがある場合は半角/全角スペースで分割し、
        // 各キーワードを q パラメータとして多重送信する（AND 検索）
        // swagger 仕様に基づき最大10語までとする
        if (searchQuery) {
          const keywords = searchQuery
            .split(/[\s\u3000]+/)
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
            .slice(0, 10);
          for (const keyword of keywords) {
            params.append("q", keyword);
          }
        }

        // 念のためイベント取得APIにもトークンがあれば渡すよう設定（不要な場合はheadersを外してもOKです）
        const headers: Record<string, string> = {};
        if (session?.token) {
          headers.Authorization = `Bearer ${session.token}`;
        }

        const res = await fetch(`/api/v1/events?${params.toString()}`, {
          headers,
        });

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
              createdAt: apiEvent.createdAt,
              eventDate: apiEvent.eventDate,
              profileId: apiEvent.profileId,
              hostName: apiEvent.profile?.displayName ?? "名無しのゲンゴロウ",
              hostAvatarUrl: apiEvent.profile?.avatarUrl ?? "",
              dateLabel: new Date(apiEvent.eventDate).toLocaleDateString(
                "ja-JP",
                {
                  month: "short",
                  day: "numeric",
                  timeZone: "Asia/Tokyo",
                },
              ),
              tags: apiEvent.tags,
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
  }, [currentPage, sortBy, searchQuery, session, isSessionLoading]); // 依存配列に session と loading 状態を追加

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

  // ソートオプションの変更を処理する関数
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // 検索クエリの変更を処理する関数
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* 検索・投稿・件数 */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {totalCount} 件のイベント
          </span>
          <CreateEventButton
            type="button"
            onClick={handleCreateEvent}
            aria-label="イベントを投稿"
          />
        </div>
        <EventSearchBar
          onSearch={handleSearch}
          initialValue={searchQuery}
          placeholder="タイトル・詳細・主催者・地域・持ち物で検索"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-4">
        <p className="text-xs text-slate-500 px-1">
          これから開催されるイベントを縦にスクロールして確認できます。
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
    </div>
  );
}
