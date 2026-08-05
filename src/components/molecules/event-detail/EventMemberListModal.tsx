"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UseEventMembersResult } from "@/hooks/useEventMembers";
import { Users, X } from "lucide-react";
import { useCallback, useEffect } from "react";

// 参加者一覧モーダルのプロパティ
type EventMemberListModalProps = {
  memberState: UseEventMembersResult;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// 申込日時を日本語表記へ整形
const formatCreatedAt = (iso: string): string =>
  new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

// 参加者一覧本体
function EventMemberListBody({
  memberState,
}: Readonly<{
  memberState: UseEventMembersResult;
}>) {
  const { data, isLoading, error } = memberState;

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
      {/* サマリー */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
          参加組数: {data.totalCount}
        </span>

        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
          合計参加人数: {data.totalMembers}
        </span>
      </div>

      {/* 参加者一覧 */}
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
              <tr
                key={`${member.mailAddress}-${member.createdAt}`}
                className="align-top"
              >
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

                <td className="break-all px-4 py-3 text-slate-700">
                  {member.mailAddress}
                </td>

                <td className="px-4 py-3 text-slate-700">{member.partySize}</td>

                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
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

// 参加者一覧モーダル
export function EventMemberListModal({
  memberState,
  isOpen,
  onOpenChange,
}: Readonly<EventMemberListModalProps>) {
  // モーダルを閉じる
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // モーダル表示中は背景スクロールをロックし、Escapeで閉じる
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景 */}
      <button
        type="button"
        aria-label="参加者一覧モーダルを閉じる"
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
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
            {/* ヘッダー */}
            <div className="flex shrink-0 items-center justify-between">
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
                className="cursor-pointer"
                onClick={handleClose}
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 本文 */}
            <div className="min-h-0 overflow-y-auto pr-1">
              <EventMemberListBody memberState={memberState} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EventMemberListModal;
