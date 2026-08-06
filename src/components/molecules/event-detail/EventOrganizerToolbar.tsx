"use client";

import { FilePlus2, Send, Trash2, Users } from "lucide-react";
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
      className="fixed top-1/2 z-40 -translate-y-1/2"
      // body の padding-right に追従して右端位置を補正する(ツールバーのみズレをなくすため)
      style={{
        right: `calc(1.5rem + ${bodyPaddingRight - 1}px)`,
      }}
    >
      <div className="rounded-3xl border border-slate-200 bg-white/95 px-1.5 py-7 shadow-xl backdrop-blur">
        <p className="mb-4 text-center text-[13px] font-semibold tracking-wide text-slate-400">
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

          <div className="my-3 h-px w-12 bg-slate-200" />

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

          <div className="my-3 h-px w-12 bg-slate-200" />

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
