"use client";

import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";
import { Button } from "@/components/ui/button";
import type { UseEventMembersResult } from "@/hooks/useEventMembers";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Send, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { CardContent } from "../../ui/card";

// ==============================
// Props
// ==============================

type EventMemberListModalProps = {
  memberState: UseEventMembersResult;
  eventTitle: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onNotify: () => void;
};

// ==============================
// 日付整形
// ==============================

const formatCreatedAt = (iso: string): string =>
  new Date(iso).toLocaleString("ja-JP", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

// ==============================
// サマリーカード
// ==============================

function SummaryCard({
  title,
  value,
  unit,
  color,
}: Readonly<{
  title: string;
  value: number;
  unit: string;
  color: "green" | "blue";
}>) {
  const styles =
    color === "green"
      ? {
          bg: "bg-lime-50",
          text: "text-lime-700",
        }
      : {
          bg: "bg-sky-50",
          text: "text-sky-700",
        };

  return (
    <div
      className={`
        min-w-[120px]
        rounded-2xl
        ${styles.bg}
        px-4
        py-3
      `}
    >
      <p className={`text-xs font-medium ${styles.text}`}>{title}</p>

      <p className={`mt-1 text-3xl font-bold ${styles.text}`}>
        {value}
        <span className="ml-1 text-lg">{unit}</span>
      </p>
    </div>
  );
}

// 参加者一覧本体
function EventMemberListBody({
  memberState,
  onNotify,
}: Readonly<{
  memberState: UseEventMembersResult;
  onNotify: () => void;
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
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      {/* サマリー */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <SummaryCard
            title="参加組数"
            value={data.totalCount}
            unit="組"
            color="green"
          />

          <SummaryCard
            title="合計人数"
            value={data.totalMembers}
            unit="名"
            color="blue"
          />
        </div>

        <Button
          type="button"
          onClick={onNotify}
          className="h-11 gap-2 rounded-full bg-sky-500 px-6 font-semibold text-white hover:bg-sky-600"
        >
          <Send className="h-4 w-4 text-white" />
          全体連絡
        </Button>
      </div>

      {/* 参加者一覧 */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* ヘッダー */}
        <table className="w-full table-fixed">
          <thead className="bg-slate-100">
            <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-600">
              <th className="w-[35%] px-6 py-3">ユーザー名</th>
              <th className="w-[30%] px-6 py-3">メールアドレス</th>
              <th className="w-[15%] px-6 py-3 text-center">参加人数</th>
              <th className="w-[20%] px-6 py-3 text-right">申し込み日時</th>
            </tr>
          </thead>
        </table>

        {/* tbodyだけスクロール */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full table-fixed">
            <tbody>
              {data.members.map((member) => (
                <tr
                  key={`${member.mailAddress}-${member.createdAt}`}
                  className="border-b border-slate-200 last:border-0"
                >
                  {/* ユーザー */}
                  <td className="w-[35%] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <GlobalUserAvatar
                        name={member.username}
                        iconUrl={undefined}
                        className="h-10 w-10"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {member.username}
                          </p>

                          {member.profileId === null && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              匿名参加
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* メール */}
                  <td className="w-[30%] px-6 py-5 text-slate-500">
                    {member.mailAddress}
                  </td>

                  {/* 参加人数 */}
                  <td className="w-[15%] px-6 py-5 text-center">
                    <span className="text-xl font-bold text-lime-700">
                      {member.partySize}
                    </span>
                    <span className="ml-1 text-sm text-slate-500">名</span>
                  </td>

                  {/* 日時 */}
                  <td className="w-[20%] px-6 py-5 text-right text-slate-500">
                    {formatCreatedAt(member.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 参加者一覧モーダル
export function EventMemberListModal({
  memberState,
  eventTitle,
  isOpen,
  onOpenChange,
  onNotify,
}: Readonly<EventMemberListModalProps>) {
  // モーダルを閉じる
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // モーダル表示中は背景スクロールをロックし、Escapeで閉じる
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // モーダル表示中に背景のツールバーボタンへフォーカスが残ると、
    // ブラウザ最小化→復元時の focus イベントで Tooltip が開きっぱなしになるため blur する
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center bg-black/50 p-6">
      {/* 背景クリック */}
      <button
        type="button"
        className="absolute inset-0"
        onClick={handleClose}
        aria-label="閉じる"
      />

      <div
        className="relative z-10 flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-list-modal-title"
      >
        {/* ================= Header ================= */}
        <div className="flex items-start justify-between border-b border-slate-200 px-8 py-6">
          <div>
            <h2
              id="member-list-modal-title"
              className="text-2xl font-bold text-slate-900"
            >
              参加者一覧
            </h2>

            <p className="mt-2 text-slate-500">{eventTitle}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ================= Body ================= */}
        <CardContent className="flex flex-1 flex-col bg-white px-8 py-6 overflow-hidden">
          <EventMemberListBody memberState={memberState} onNotify={onNotify} />
        </CardContent>
      </div>
    </div>
  );
}

export default EventMemberListModal;
