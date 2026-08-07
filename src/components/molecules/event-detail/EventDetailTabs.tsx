"use client";

import { cn } from "@/lib/utils";

// イベント詳細画面のタブ種別。
export type EventDetailTab = "detail" | "report";

// タブの id。タブパネル側（EventDetail）が aria-labelledby で参照する。
//
// 逆方向（タブ → パネル）の aria-controls は付けない。
// パネルはアクティブなタブの分だけを条件レンダリングしており、
// 非アクティブなタブから参照すると存在しない id を指してしまうため。
export const eventDetailTabId = (tab: EventDetailTab): string =>
  `event-detail-tab-${tab}`;

type EventDetailTabsProps = {
  activeTab: EventDetailTab;
  onTabChange: (tab: EventDetailTab) => void;
  // 活動レポートが投稿済みかどうか。true のときタブラベルの横にドットを点灯する。
  hasReport: boolean;
};

// イベント詳細画面のタブ（詳細 / 活動レポート）。
// 下線でアクティブ状態を示す。レポートが投稿済みのときだけ
// 「活動レポート」の横にオレンジのドットを出して更新があることを伝える。
export function EventDetailTabs({
  activeTab,
  onTabChange,
  hasReport,
}: Readonly<EventDetailTabsProps>) {
  const tabs = [
    { value: "detail", label: "詳細" },
    { value: "report", label: "活動レポート" },
  ] as const;

  return (
    <div className="border-b border-slate-200">
      <div
        role="tablist"
        aria-label="イベント詳細の表示切り替え"
        className="flex gap-2"
      >
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={eventDetailTabId(tab.value)}
              aria-selected={isActive}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-(--brand-green) font-bold text-(--brand-green-text)"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {tab.value === "report" && hasReport ? (
                <>
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-orange)"
                  />
                  <span className="sr-only">レポートあり</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
