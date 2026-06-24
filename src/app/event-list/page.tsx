"use client"; // ソート（状態管理）を行うため Client Component に変更

import { ArrowUpDown } from "lucide-react"; // ソート用のアイコン
import { useEffect, useMemo, useState } from "react"; // useEffect を追加
import { EventCard, type EventItem } from "@/components/EventCard";
import { TimelineHeader } from "@/components/organisms/TimelineHeader"; // headerコンポーネントをインポート
import { Button } from "@/components/ui/button"; // 既存の共通ボタンをインポート
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ソートの種類をここで一元管理（増えたらここに追加）
type SortOption = "postedAt_desc" /* | "startAt_asc" | "startAt_desc" */;

export default function EventListPage() {
  // データを保持するステートを定義（初期値は空配列）
  const [events, setEvents] = useState<EventItem[]>([]);
  // 現在選択されているソート条件を管理（初期値は投稿日時の降順）
  const [sortBy, setSortBy] = useState<SortOption>("postedAt_desc");

  // ページネーション用のステート（1ページ目からスタート）
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // 1ページあたりの最大表示件数

  // 認証状態を取得するカスタムフックを使用
  const { session, isLoading: isAuthLoading } = useAuth();
  const { user: currentUser, isLoading: isUserLoading } =
    useCurrentUser(session);

  /*
  // MSW のログイン状態取得は残しています。
  // 実運用では Supabase の認証状態を使うため、現在はコメントアウトしています。
  useEffect(() => {
    let cancelled = false;

    const fetchUserProfile = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch("/api/v1/me");

        if (res.status === 401) {
          return;
        }

        if (!res.ok) {
          throw new Error(
            `ユーザー情報の取得に失敗しました (Status: ${res.status})`,
          );
        }

        const data = (await res.json()) as UserProfile;

        if (!cancelled) {
          setUser(data);
          setIsUserLoading(false);
        }
      } catch (err) {
        if (!cancelled && attempt < 5) {
          setTimeout(
            () => void fetchUserProfile(attempt + 1),
            200 * (attempt + 1),
          );
          return;
        }

        console.log("ユーザーが未サインイン、または取得エラー:", err);
        if (!cancelled) {
          setUser(null);
          setIsUserLoading(false);
        }
      }
    };

    void fetchUserProfile();

    return () => {
      cancelled = true;
    };
  }, []);
  */

  // MSWの準備完了を待ってからフェッチする（既存のイベント一覧取得用）
  useEffect(() => {
    let cancelled = false; // コンポーネントがアンマウントされたかどうかを追跡するフラグ
    // データ取得関数を定義（リトライ機能付き）
    const fetchEvents = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch("/api/events"); // MSWのモックAPIを叩く

        // MSW の起動前に素通りして 404 になることがあるため、数回はリトライする
        if (!res.ok) {
          if (!cancelled && attempt < 5) {
            setTimeout(
              () => void fetchEvents(attempt + 1),
              200 * (attempt + 1),
            );
            return;
          }

          // それでも失敗した場合はエラーを投げる
          throw new Error(`データの取得に失敗しました (Status: ${res.status})`);
        }

        const data = (await res.json()) as EventItem[]; // 取得したデータを型アサーションして EventItem[] として扱う
        if (!cancelled) setEvents(data);
      } catch (err) {
        // MSW の起動タイミングによっては最初のリクエストが素通りすることがあるため、数回だけリトライする
        if (!cancelled && attempt < 5) {
          setTimeout(() => void fetchEvents(attempt + 1), 200 * (attempt + 1));
          return;
        }

        console.error("Fetchエラー:", err); // コンソールにエラーを出力
      }
    };

    // データ取得関数を呼び出す
    void fetchEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  // useMemoでソート結果をキャッシュ。sortByかデータが変わった時だけ再計算する
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      switch (sortBy) {
        case "postedAt_desc": // 投稿日時が新しい順（降順）
          return (
            new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          );

        default:
          return 0; // そのまま
      }
    });
  }, [events, sortBy]);

  // ソート済みのデータから、現在のページに必要な件数（最大15件）だけを切り出す
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const _endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedEvents.slice(startIndex, _endIndex);
  }, [sortedEvents, currentPage]);

  // 全ページ数を計算（30件なら 30÷15＝2ページ）
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);

  // 現在のページから前後2ページ分の範囲のページ番号を動的に生成
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

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased selection:bg-emerald-100">
      {/* 固定ヘッダー */}
      <TimelineHeader
        eventCount={events.length}
        isUserLoading={isAuthLoading || isUserLoading}
        session={session}
        user={currentUser}
      />

      {/* タイムラインメインコンテンツ */}
      <main className="mx-auto max-w-xl px-4 pt-4 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-4">
          <p className="text-xs text-slate-500 px-1">
            これから開催される自然観察イベントを縦にスクロールして確認できます。
          </p>

          {/* ソート切り替えUI（セレクトボックス） */}
          <div className="flex items-center gap-1.5 self-end shrink-0 bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="text-xs font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="postedAt_desc">投稿が新しい順</option>
            </select>
          </div>
        </div>

        {/* カードを縦に並べるタイムラインコンテナ */}
        <div className="space-y-4">
          {paginatedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* ページネーションUI（データが15件以上ある場合のみ表示） */}
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
