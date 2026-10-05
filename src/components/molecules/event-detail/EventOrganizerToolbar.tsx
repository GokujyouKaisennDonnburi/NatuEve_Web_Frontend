"use client";

import { FilePlus2, Send, Trash2, Users } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
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
  // useScrollLock が body に設定した padding-right（in-flow コンテンツの右端を維持するための補償）。
  // fixed 要素は ICB（ビューポート）基準のためこの補償が効かず、モーダル表示時に
  // スクロールバーが消えて ICB が広がると右へズレる。body の padding-right を読み取って
  // 同じ分だけ right を加算することで、コンテンツ右端に対する相対位置を維持する。
  const [bodyPaddingRight, setBodyPaddingRight] = useState(0);

  useEffect(() => {
    const sync = (): void => {
      const value = parseFloat(getComputedStyle(document.body).paddingRight);
      setBodyPaddingRight(Number.isNaN(value) ? 0 : value);
    };

    sync();

    // useScrollLock が body の inline style を変更するのを監視して追従する
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });
    window.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <aside
      className="fixed right-4 bottom-3 left-4 z-40 sm:right-6 sm:left-auto lg:top-1/2 lg:right-[var(--organizer-toolbar-right)] lg:bottom-auto lg:-translate-y-1/2"
      // body の padding-right に追従して右端位置を補正する(ツールバーのみズレをなくすため)
      style={
        {
          "--organizer-toolbar-right": `calc(1.5rem + ${bodyPaddingRight - 1}px)`,
        } as CSSProperties
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-xl backdrop-blur lg:rounded-3xl lg:px-1.5 lg:py-7">
        <p className="sr-only text-center text-[13px] font-semibold tracking-wide text-slate-400 lg:not-sr-only lg:mb-4">
          主催者
        </p>

        {/* ツールバーのボタン群 */}
        <div className="flex items-center justify-center gap-1 lg:flex-col lg:gap-0">
          {/* 参加者一覧ボタン */}
          <EventOrganizerToolbarButton
            icon={Users}
            label="参加者一覧"
            onClick={onMemberList}
            disabled={!hasMembers}
            color="green"
          />

          {/* 全体連絡ボタン */}
          <EventOrganizerToolbarButton
            icon={Send}
            label="全体連絡"
            onClick={onNotify}
            disabled={!hasMembers}
            color="blue"
          />

          <div className="mx-1 h-9 w-px bg-slate-200 lg:mx-0 lg:my-3 lg:h-px lg:w-12" />

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

          <div className="mx-1 h-9 w-px bg-slate-200 lg:mx-0 lg:my-3 lg:h-px lg:w-12" />

          {/* レポート作成ボタン */}
          <EventOrganizerToolbarButton
            icon={FilePlus2}
            label="レポート作成"
            onClick={onReport}
            color="orange"
          />
        </div>
      </div>
    </aside>
  );
}
