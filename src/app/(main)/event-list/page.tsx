"use client";

import { FilterIconButton } from "@/components/atoms/FilterIconButton";
import { SortButton } from "@/components/atoms/SortButton";
import { Loading } from "@/components/atoms/Loading";
import { SearchBar } from "@/components/molecules/SearchBar";
import { Pagination } from "@/components/molecules/Pagination";
import { EventCard } from "@/components/organisms/EventCard";
import { FilterSidebar } from "@/components/organisms/FilterSidebar";
import { useEventList } from "@/hooks/useEventList";
import { useTags } from "@/hooks/useTags";
import type { TagItem } from "@/types/tag";
import { useMemo, useState } from "react";

type SortOption = "created_at" | "event_date";

export default function EventListPage() {
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [currentPage, setCurrentPage] = useState(1);
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

  // 絞り込みフィルターの状態（適用済み: 「N件を表示」押下で反映され、APIリクエストに使われる）
  const [appliedTagIds, setAppliedTagIds] = useState<string[]>([]);
  const [appliedRegions, setAppliedRegions] = useState<string[]>([]);
  const [appliedPrefectures, setAppliedPrefectures] = useState<string[]>([]);
  const [appliedCities, setAppliedCities] = useState<string[]>([]);

  const { tags: allTags } = useTags();

  const { events, totalCount, loading, error } = useEventList({
    currentPage,
    sortBy,
    searchQuery,
    selectedTagIds: appliedTagIds,
    regions: appliedRegions,
    prefectures: appliedPrefectures,
    cities: appliedCities,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "event_date", label: "開催日が近い順" },
    { value: "created_at", label: "投稿が新しい順" },
  ];

  // ソートオプションの変更を処理する関数
  const handleSortChange = (value: string) => {
    const validSortOptions = ["event_date", "created_at"] as const;
    if (!validSortOptions.includes(value as (typeof validSortOptions)[number]))
      return;
    setSortBy(value as SortOption);
    setCurrentPage(1);
  };

  // 検索クエリの変更を処理する関数
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
    setAppliedRegions([]);
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

  // 「N件を表示」押下時にドラフト状態を適用済み状態に反映し、APIリクエストをトリガーする
  const handleApply = () => {
    setAppliedTagIds(selectedTagIds);
    setAppliedRegions(selectedRegions);
    setAppliedPrefectures(selectedPrefectures);
    setAppliedCities(selectedCities);
    setCurrentPage(1);
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
    <div className="mx-auto max-w-[1728px] px-[max(16px,3%)] pt-[59px]">
      {/* Title */}
      <h1 className="text-[40px] leading-[58px] text-black font-normal mb-[60px]">
        イベントを探す
      </h1>

      {/* Search + Sort row */}
      <div className="flex items-start gap-4 mb-[23px]">
        <div className="flex-1">
          <SearchBar
            onSearch={handleSearch}
            initialValue={searchQuery}
            className="w-full"
          />
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <SortButton
            label="並び替え"
            options={sortOptions}
            value={sortBy}
            onChange={handleSortChange}
          />
        </div>
      </div>

      {/* Filter button row */}
      <div className="mb-[45px]">
        <FilterIconButton onClick={() => {}} isActive={hasActiveFilters} />
      </div>

      {/* Two-column: Filter sidebar + Event list */}
      <div className="flex items-start gap-[36px]">
        {/* Filter sidebar */}
        <aside className="w-[342px] shrink-0 sticky top-8">
          <FilterSidebar
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
            resultCount={totalCount}
            onClearAll={handleClearAll}
            onClear={handleClear}
            onApply={handleApply}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
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
