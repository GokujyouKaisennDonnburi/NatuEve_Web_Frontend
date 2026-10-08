import { FilterIconButton } from "@/components/atoms/FilterIconButton";
import { SortButton, type SortOption } from "@/components/atoms/SortButton";
import { SearchBar } from "@/components/molecules/SearchBar";
import type { Ref } from "react";

type EventListControlsProps = {
  searchInitialValue: string;
  onSearch: (query: string) => void;
  sortOptions: SortOption[];
  sortValue: SortOption["value"];
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
// 容器は全幅で粘着するため、クリップが効く前の透過領域がカードのクリックを
// 奪わないよう pointer-events は検索バーとボタン群側でのみ有効にする(旧実装と同じ)。
// 下余白は旧構成(検索行 mb-[23px] + 絞り込み行 mb-6/desktop:mb-[45px])と
// 同じ合計値(モバイル 47px / デスクトップ 68px)を維持する。
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
      // 粘着位置はヘッダー直下からマージン(gap)を空けてフローティング感を出す。
      // 数値は globals.css の --event-list-controls-gap が単一のソース
      className="sticky top-[calc(var(--site-header-height)_+_var(--event-list-controls-gap))] z-30 mb-[47px] desktop:mb-[68px]"
    >
      <div className="pointer-events-none flex flex-col gap-3 desktop:flex-row desktop:items-center desktop:gap-4">
        <div className="pointer-events-auto w-full min-w-0 desktop:flex-1">
          <SearchBar
            onSearch={onSearch}
            initialValue={searchInitialValue}
            className="w-full"
          />
        </div>
        <div className="pointer-events-auto flex w-full items-center justify-between gap-3 desktop:w-auto desktop:shrink-0 desktop:justify-end">
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
