"use client";

import { FilterIconButton } from "@/components/atoms/FilterIconButton";
import { SortButton } from "@/components/atoms/SortButton";
import { SearchBar } from "@/components/molecules/SearchBar";

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
};

// イベント一覧のコントロール(検索バー・並び替え・絞り込み開閉ボタン)を
// ヘッダー直下に粘着(フローティング)表示させる容器。
// 縦長比率(絞り込みボタン表示時)では並び替えと絞り込みボタンを同じ高さに並べ、
// 横長比率(desktop バリアント)では検索バーと並び替えを1行に収める。
// パネルは不透明にして、スクロール中に背後のイベントカードや
// 絞り込みサイドバーが透けて見えないようにする。
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
}: Readonly<EventListControlsProps>) {
  return (
    <div className="sticky top-(--site-header-height) z-30 mb-6 desktop:mb-[45px]">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E3E8DF] bg-white p-3 shadow-[0_2px_12px_rgba(39,46,36,0.10)] desktop:flex-row desktop:items-center desktop:gap-4">
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
