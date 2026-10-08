"use client";

import { Loading } from "@/components/atoms/Loading";
import { Pagination } from "@/components/molecules/Pagination";
import { EventCard } from "@/components/organisms/EventCard";
import { EventListControls } from "@/components/organisms/EventListControls";
import { FilterDrawer } from "@/components/organisms/FilterDrawer";
import { FilterSidebar } from "@/components/organisms/FilterSidebar";
import { useEventList } from "@/hooks/useEventList";
import { useStickyClip } from "@/hooks/useStickyClip";
import { useTags } from "@/hooks/useTags";
import type { TagItem } from "@/types/tag";
import { useMemo, useRef, useState, useCallback } from "react";

type SortBy = "created_at" | "event_date";

// 並び替えの選択肢。定数のためコンポーネント外に置き、再レンダーでの再生成を避ける
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "event_date", label: "開催日が近い順" },
  { value: "created_at", label: "投稿が新しい順" },
];

export default function EventListPage() {
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // 適用済みの検索クエリ。SearchBar の onSearch（検索ボタン押下 / Enter）でのみ更新されるため、
  // 入力中の値では API は呼ばれない
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 15;

  // 絞り込みフィルターの状態（ドラフト: サイドバーでの選択状態）
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const [expandedPrefectures, setExpandedPrefectures] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  // 絞り込みフィルターの状態（適用済み: 「絞り込み」押下で反映され、APIリクエストに使われる）
  const [appliedTagIds, setAppliedTagIds] = useState<string[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);
  const [appliedPrefectures, setAppliedPrefectures] = useState<string[]>([]);
  const [appliedCities, setAppliedCities] = useState<string[]>([]);

  const { tags: allTags } = useTags();

  const { events, totalCount, loading, error } = useEventList({
    currentPage,
    sortBy,
    searchQuery,
    selectedTagIds: appliedTagIds,
    selectedStatuses: appliedStatuses,
    prefectures: appliedPrefectures,
    cities: appliedCities,
    itemsPerPage: ITEMS_PER_PAGE,
  });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // コントロール帯の下に回り込んだカードを隠すための計測用参照。
  // コントロール帯は背景を持たないため、帯の範囲に入ったカードは
  // useStickyClip が帯の下端+8px(上部マージンと対になる余白)を基準に切り取る
  const controlsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useStickyClip({ barRef: controlsRef, contentRef, bottomMargin: 8 });

  // FilterDrawer の effect 依存が毎レンダー変化しないよう、クローズ処理は安定参照で渡す
  const handleCloseFilter = useCallback(() => setIsFilterOpen(false), []);

  // 現在表示中のイベントから使用頻度の高いタグ順に算出する
  const frequentTags = useMemo(() => {
    const countMap = new Map<string, number>();
    const tagMap = new Map<string, TagItem>();
    for (const event of events) {
      for (const tag of event.tags ?? []) {
        countMap.set(tag.id, (countMap.get(tag.id) ?? 0) + 1);
        tagMap.set(tag.id, tag);
      }
    }
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => tagMap.get(id))
      .filter((t): t is TagItem => t != null);
  }, [events]);

  // ソートオプションの変更を処理する関数
  const handleSortChange = (value: string) => {
    const validSortOptions = SORT_OPTIONS.map((option) => option.value);
    if (!validSortOptions.includes(value as SortBy)) return;
    setSortBy(value as SortBy);
    setCurrentPage(1);
  };

  // 検索ボタン押下（または Enter）時にのみ呼ばれ、適用済み検索クエリを更新して一覧を再取得する
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // タグの選択/解除を処理する関数
  const handleTagSelect = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  // 全フィルターをリセットする関数
  const [filterResetKey, setFilterResetKey] = useState(0);
  const resetFilters = () => {
    setSelectedTagIds([]);
    setSelectedRegions([]);
    setSelectedPrefectures([]);
    setSelectedCities([]);
    setExpandedRegions([]);
    setExpandedPrefectures([]);
    setSelectedStatuses([]);
    setFreeOnly(false);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setAppliedTagIds([]);
    setAppliedStatuses([]);
    setAppliedPrefectures([]);
    setAppliedCities([]);
    setFilterResetKey((prev) => prev + 1);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    resetFilters();
  };

  const handleClear = () => {
    resetFilters();
  };

  // 「絞り込み」押下時にドラフト状態を適用済み状態に反映し、APIリクエストをトリガーする
  const handleApply = () => {
    setAppliedTagIds(selectedTagIds);
    setAppliedStatuses(selectedStatuses);
    setAppliedPrefectures(selectedPrefectures);
    setAppliedCities(selectedCities);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };
  const hasActiveFilters =
    selectedTagIds.length > 0 ||
    selectedRegions.length > 0 ||
    selectedPrefectures.length > 0 ||
    selectedCities.length > 0 ||
    selectedStatuses.length > 0 ||
    freeOnly ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  return (
    <div className="mx-auto max-w-[1728px] px-[max(16px,3%)] pt-8 sm:pt-[59px]">
      {/* Title */}
      <h1 className="mb-10 text-[32px] font-normal leading-[46px] text-black sm:mb-[60px] sm:text-[40px] sm:leading-[58px]">
        イベントを探す
      </h1>

      {/* Controls (Search + Sort + Filter toggle)
          検索バー・並び替え・絞り込みボタンをヘッダー直下に粘着(フローティング)表示させる。
          縦長比率(絞り込みボタン表示時)では並び替えと絞り込みボタンを同じ高さに並べ、
          横長比率(desktop バリアント)では検索バーと並び替えを1行に収める。
          デザインを変えないため帯には背景を付けず、スクロールで帯の範囲に入った
          カードは useStickyClip が帯の下端を基準に切り取って非表示にする */}
      <EventListControls
        ref={controlsRef}
        searchInitialValue={searchQuery}
        onSearch={handleSearch}
        sortOptions={SORT_OPTIONS}
        sortValue={sortBy}
        onSortChange={handleSortChange}
        onFilterToggle={() => setIsFilterOpen((prev) => !prev)}
        isFilterActive={hasActiveFilters}
        isFilterExpanded={isFilterOpen}
        filterControlsId="event-list-filters"
      />

      {/* Two-column: Filter sidebar + Event list */}
      <div className="grid items-start gap-6 desktop:grid-cols-[var(--filter-sidebar-width)_minmax(0,1fr)] desktop:gap-[36px]">
        {/* Filter sidebar
            モバイル(縦長比率)では FilterDrawer が左からスライドするオーバーレイとして表示し、
            デスクトップ(横長比率)では常に左側に表示するサイドバーになる */}
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={handleCloseFilter}
          id="event-list-filters"
        >
          <FilterSidebar
            className="xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            allTags={allTags}
            frequentTags={frequentTags}
            tagFilterKey={filterResetKey}
            selectedTagIds={selectedTagIds}
            onTagSelect={handleTagSelect}
            selectedRegions={selectedRegions}
            selectedPrefectures={selectedPrefectures}
            selectedCities={selectedCities}
            onRegionsChange={setSelectedRegions}
            onPrefecturesChange={setSelectedPrefectures}
            onCitiesChange={setSelectedCities}
            expandedRegions={expandedRegions}
            expandedPrefectures={expandedPrefectures}
            onToggleRegion={(region) =>
              setExpandedRegions((prev) =>
                prev.includes(region)
                  ? prev.filter((r) => r !== region)
                  : [...prev, region],
              )
            }
            onTogglePrefecture={(prefecture) =>
              setExpandedPrefectures((prev) =>
                prev.includes(prefecture)
                  ? prev.filter((p) => p !== prefecture)
                  : [...prev, prefecture],
              )
            }
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            freeOnly={freeOnly}
            onFreeOnlyChange={setFreeOnly}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onClearAll={handleClearAll}
            onClear={handleClear}
            onApply={handleApply}
          />
        </FilterDrawer>

        {/* Main content */}
        <div ref={contentRef} className="min-w-0">
          {/* Loading indicator */}
          {loading && (
            <div className="mb-4">
              <Loading label="イベントを読み込み中..." />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Event count */}
          <div className="mb-4">
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {totalCount} 件のイベント
            </span>
          </div>

          {/* Event cards */}
          <div className="space-y-[30px]">
            {!loading &&
              events.map((event) => <EventCard key={event.id} event={event} />)}
            {!loading && events.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">
                表示するイベントがありません。
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
