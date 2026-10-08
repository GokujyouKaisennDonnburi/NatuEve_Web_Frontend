"use client";

import { FilterIconButton } from "@/components/atoms/FilterIconButton";
import { SortButton } from "@/components/atoms/SortButton";
import { SearchBar } from "@/components/molecules/SearchBar";
import type { Ref } from "react";

type SortOption = {
  value: string;
  label: string;
};

type EventListControlsProps = {
  searchInitialValue: string;
  onSearch: (query: string) => void;
  sortOptions: SortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  onFilterToggle: () => void;
  isFilterActive: boolean;
  isFilterExpanded: boolean;
  filterControlsId: string;
  // 粘着位置の計測用。ページ側で useStickyClip に渡す
  ref?: Ref<HTMLDivElement>;
};

// イベント一覧のコントロール(検索バー・並び替え・絞り込み開閉ボタン)を
// ヘッダー直下に粘着(フローティング)表示させる容器。
// 縦長比率(絞り込みボタン表示時)では並び替えと絞り込みボタンを同じ高さに並べ、
// 横長比率(desktop バリアント)では検索バーと並び替えを1行に収める。
// 各コントロールが本来持つデザインを優先するため容器自体には背景を付けず、
// スクロールで背後に潜ったカードはページ側の useStickyClip で
// この容器の下端を基準に切り取る。
// ドロワー(FilterDrawer)より低い z-index で開閉ボタンの役割を維持する。
export function EventListControls({
  searchInitialValue,
  onSearch,
  sortOptions,
  sortValue,
  onSortChange,
  onFilterToggle,
  isFilterActive,
  isFilterExpanded,
  filterControlsId,
  ref,
}: Readonly<EventListControlsProps>) {
  return (
    <div
      ref={ref}
      // 粘着位置はヘッダー直下から 8px 空けてフローティング感を出す
      className="sticky top-[calc(var(--site-header-height)_+_8px)] z-30 mb-6 desktop:mb-[45px]"
    >
      <div className="flex flex-col gap-3 desktop:flex-row desktop:items-center desktop:gap-4">
        <div className="w-full min-w-0 desktop:flex-1">
          <SearchBar
            onSearch={onSearch}
            initialValue={searchInitialValue}
            className="w-full"
          />
        </div>
        <div className="flex w-full items-center justify-between gap-3 desktop:w-auto desktop:shrink-0 desktop:justify-end">
          {/* 絞り込みボタンは縦長比率でのみ表示し、並び替えと同じ高さに置く */}
          <FilterIconButton
            className="desktop:hidden"
            onClick={onFilterToggle}
            isActive={isFilterActive}
            isExpanded={isFilterExpanded}
            controls={filterControlsId}
          />
          <SortButton
            label="並び替え"
            options={sortOptions}
            value={sortValue}
            onChange={onSortChange}
          />
        </div>
      </div>
    </div>
  );
}
