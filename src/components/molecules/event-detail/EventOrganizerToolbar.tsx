"use client";

import { FilePlus2, Send, Trash2, Users } from "lucide-react";
import { EventOrganizerToolbarButton } from "./EventOrganizerToolbarButton";

// 主催者用のツールバーのコンポーネントのプロパティ
type EventOrganizerToolbarProps = {
  hasMembers: boolean;
  onMemberList: () => void;
  onNotify: () => void;
  onDelete: () => void;
  onReport: () => void;
};

// 主催者用のツールバーのコンポーネント
export function EventOrganizerToolbar({
  hasMembers,
  onMemberList,
  onNotify,
  onDelete,
  onReport,
}: Readonly<EventOrganizerToolbarProps>) {
  return (
    <aside className="fixed right-6 top-1/2 z-40 -translate-y-1/2">
      <div className="rounded-3xl border border-amber-100 bg-white/95 px-2 py-3 shadow-xl backdrop-blur">
        <p className="mb-3 text-center text-[10px] font-semibold tracking-wide text-slate-400">
          主催者
        </p>

        {/* ツールバーのボタン群 */}
        <div className="flex flex-col items-center">
          {/* 参加者一覧ボタン */}
          <EventOrganizerToolbarButton
            icon={Users}
            label="参加者一覧"
            onClick={onMemberList}
            disabled={!hasMembers}
          />

          {/* 全体連絡ボタン */}
          <EventOrganizerToolbarButton
            icon={Send}
            label="全体連絡"
            onClick={onNotify}
            disabled={!hasMembers}
          />

          <div className="my-2 h-px w-8 bg-slate-200" />

          {/* 編集ボタン(別PBIのため、コメントアウト) */}
          {/*
          <EventOrganizerToolbarButton
            icon={Pencil}
            label="編集"
          />
          */}

          {/* 削除ボタン */}
          <EventOrganizerToolbarButton
            icon={Trash2}
            label="削除"
            onClick={onDelete}
            danger
          />

          <div className="my-2 h-px w-8 bg-slate-200" />

          {/* レポート作成ボタン */}
          <EventOrganizerToolbarButton
            icon={FilePlus2}
            label="レポート作成"
            onClick={onReport}
          />
        </div>
      </div>
    </aside>
  );
}
