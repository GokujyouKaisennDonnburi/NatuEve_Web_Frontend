"use client"; // ソート（状態管理）を行うため Client Component に変更

import { ArrowUpDown } from "lucide-react"; // ソート用のアイコン
import { useEffect, useMemo, useState } from "react"; // useEffect を追加
import { EventCard, type EventItem } from "@/components/EventCard";
import { GlobalUserAvatar } from "@/components/molecules/UserAvatar"; // 変更した名前でインポート
import { Button } from "@/components/ui/button"; // 既存の共通ボタンをインポート

// ソートの種類をここで一元管理（増えたらここに追加）
type SortOption = "postedAt_desc" /* | "startAt_asc" | "startAt_desc" */;

// /api/v1/me から返ってくる予定のユーザー情報の型定義
type UserProfile = {
  id: string;
  name: string;
  iconUrl?: string;
};

export default function EventListPage() {
  // データを保持するステートを定義（初期値は空配列）
  const [events, setEvents] = useState<EventItem[]>([]);
  // 現在選択されているソート条件を管理（初期値は投稿日時の降順）
  const [sortBy, setSortBy] = useState<SortOption>("postedAt_desc");

  // ページネーション用のステート（1ページ目からスタート）
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // 1ページあたりの最大表示件数

  // ユーザー情報を格納するステート（初期値は未サインインの null）
  const [user, setUser] = useState<UserProfile | null>(null);

  // APIからユーザー情報を取得中かどうかを管理するフラグ（最初は true）
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true);

  // /api/v1/me（ユーザープロフィール）のフェッチ処理,401で未サインイン判定
  useEffect(() => {
    let cancelled = false;

    const fetchUserProfile = async () => {
      try {
        // バックエンド（MSW）のプロフィール取得APIを叩く
        const res = await fetch("/api/v1/me");

        // 401 Unauthorized は「未サインイン」として扱う
        if (res.status === 401) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        // その他の取得失敗（認証エラー含む）
        if (!res.ok) {
          throw new Error(
            `ユーザー情報の取得に失敗しました (Status: ${res.status})`,
          );
        }

        const data = (await res.json()) as UserProfile;

        // クリーンアップ前（画面が切り替わっていない）であればステートに格納
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        // エラーハンドリング（未ログインの場合はここに落ちる想定）
        console.log("ユーザーが未サインイン、または取得エラー:", err);
        if (!cancelled) {
          setUser(null); // 安全のために未ログイン状態（null）にする
        }
      } finally {
        // 成功しても失敗しても、ローディングは必ず終了させる
        if (!cancelled) {
          setIsUserLoading(false);
        }
      }
    };

    void fetchUserProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // MSWの準備完了を待ってからフェッチする（既存のイベント一覧取得用）
  useEffect(() => {
    let cancelled = false;
    const fetchEvents = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch("/api/events");

        // エラー画面（HTML）を掴まされた場合にJSONパースエラーでクラッシュするのを防ぐ
        if (!res.ok) {
          throw new Error(`データの取得に失敗しました (Status: ${res.status})`);
        }

        const data = (await res.json()) as EventItem[];
        if (!cancelled) setEvents(data);
      } catch (err) {
        // MSW の起動タイミングによっては最初のリクエストが素通りすることがあるため、数回だけリトライする
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

  // ソートが変更されたら、強制的に1ページ目に戻す（ユーザーの迷子防止）
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased selection:bg-emerald-100">
      {/* SNS風の固定ヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            <span className="text-xl">🌿</span> 生き物イベントタイムライン
          </h1>

          {/* 件数表示とサインイン関連UIをまとめるコンテナ */}
          <div className="flex items-center gap-3">
            {/* 件数表示 */}
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {events.length} 件のイベント
            </span>

            {/* サインイン状態（userオブジェクトの有無）に応じた表示切り替え */}
            {isUserLoading ? (
              // 🔄 ユーザー情報取得中：ふわふわアニメーションするグレーの丸型プレースホルダー
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0 border border-slate-300/50" />
            ) : !user ? (
              // 🟩 未サインイン状態：登録・サインインボタン
              <Button
                size="sm"
                className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md transition-colors shrink-0 border-none cursor-pointer shadow-none"
              >
                新規登録・サインイン
              </Button>
            ) : (
              // 👤 サインイン済み状態：アバターアイコン
              <GlobalUserAvatar
                name={user.name}
                iconUrl={user.iconUrl}
                className="cursor-pointer hover:opacity-90 transition-opacity"
              />
            )}
          </div>
        </div>
      </header>

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
              onChange={(e) => setSortBy(e.target.value as SortOption)}
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
