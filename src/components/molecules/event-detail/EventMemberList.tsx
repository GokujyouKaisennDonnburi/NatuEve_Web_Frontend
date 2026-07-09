"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEventMembers } from "@/hooks/useEventMembers";
import { Users, X } from "lucide-react";
import { useEffect } from "react";

type EventMemberListModalProps = {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
};

// 申込日時を日本語表記へ整形する（EventReportList と同じフォーマット）。
const formatCreatedAt = (iso: string): string =>
  new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

// 参加者一覧本体。モーダルが開いた時にだけマウントして API を取得する。
// ローディング・エラー・空データそれぞれの表示状態を持つ。
function EventMemberListBody({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useEventMembers(eventId);

  if (isLoading) {
    return <div className="text-sm text-slate-500">読み込み中…</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error.message ?? "参加者一覧の取得に失敗しました"}
      </div>
    );
  }

  if (!data || data.members.length === 0) {
    return <div className="text-sm text-slate-500">まだ参加者はいません。</div>;
  }

  return (
    <div className="space-y-4">
      {/* 参加組数・合計参加人数サマリー */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
          参加組数: {data.totalCount}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
          合計参加人数: {data.totalMembers}
        </span>
      </div>

      {/* 参加者テーブル */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs text-slate-500 shadow-[0_-1px_0_0_#e2e8f0_inset,0_1px_0_0_#e2e8f0]">
            <tr>
              <th className="px-4 py-3 font-medium">ユーザー名</th>
              <th className="px-4 py-3 font-medium">メールアドレス</th>
              <th className="px-4 py-3 font-medium">参加人数</th>
              <th className="px-4 py-3 font-medium">申込日時</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.members.map((member) => (
              <tr key={member.id} className="align-top">
                <td className="px-4 py-3 text-slate-800">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{member.username}</span>
                    {member.profileId === null ? (
                      <span className="text-[11px] text-slate-400">
                        匿名参加
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 break-all text-slate-700">
                  {member.mailAddress}
                </td>
                <td className="px-4 py-3 text-slate-700">{member.partySize}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                  {formatCreatedAt(member.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// イベント参加者一覧モーダルコンポーネント。
// 主催者向けに GET /api/v1/events/{id}/members の結果をモーダルで表示する。
// isOpen が true の時だけ本体をマウントし、API 取得はモーダル表示時に限定する。
export function EventMemberListModal({
  eventId,
  isOpen,
  onClose,
}: Readonly<EventMemberListModalProps>) {
  // Escape キーでモーダルを閉じる＆背景スクロールを抑止する。
  // 既存モーダル（GuestParticipationModal / EventCancelButton）と同じ振る舞いに合わせる。
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景オーバーレイ：ボタンとして振るわせ、クリックで閉じる */}
      <button
        type="button"
        aria-label="参加者一覧を閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-list-modal-title"
      >
        <Card className="flex max-h-[85vh] flex-col overflow-hidden border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
          <CardContent className="flex flex-col gap-5 overflow-hidden pt-6">
            {/* ヘッダー：スクロールしないよう固定 */}
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2
                id="member-list-modal-title"
                className="flex items-center gap-2 text-lg font-bold text-slate-900"
              >
                <Users className="h-5 w-5 text-emerald-500" />
                参加者一覧
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="cursor-pointer"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 本文：参加者が多い場合にスクロールする */}
            <div className="min-h-0 overflow-y-auto pr-1">
              <EventMemberListBody eventId={eventId} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EventMemberListModal;
