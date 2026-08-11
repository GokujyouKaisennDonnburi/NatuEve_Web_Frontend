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
  // 主催者かつレポート未投稿のとき true。タブラベルの横にオレンジのドットを点灯する。
  showReportBadge: boolean;
  // 主催者以外でレポート未投稿のとき true。活動レポートタブをクリック不可にする。
  reportTabDisabled: boolean;
};

// イベント詳細画面のタブ（詳細 / 活動レポート）。
// 下線でアクティブ状態を示す。主催者でレポート未投稿のときは「活動レポート」の横に
// オレンジのドットを出してレポート作成を促す。主催者以外でレポート未投稿のときは
// 閲覧対象のレポートが存在しないため、活動レポートタブを選択不可にする。
export function EventDetailTabs({
  activeTab,
  onTabChange,
  showReportBadge,
  reportTabDisabled,
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
          // 主催者以外がレポート未投稿のとき、活動レポートタブは選択不可にする。
          const disabled = tab.value === "report" && reportTabDisabled;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={eventDetailTabId(tab.value)}
              aria-selected={isActive}
              aria-disabled={disabled}
              disabled={disabled}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors",
                disabled
                  ? "cursor-default border-transparent text-slate-500"
                  : isActive
                    ? "cursor-pointer border-(--brand-green) font-bold text-(--brand-green-text)"
                    : "cursor-pointer border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {tab.value === "report" && showReportBadge ? (
                <>
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-orange)"
                  />
                  <span className="sr-only">レポート未作成</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
