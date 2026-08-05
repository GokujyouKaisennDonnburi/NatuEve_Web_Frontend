"use client";

import { TagFilter } from "@/components/molecules/TagFilter";
import { RegionFilter } from "@/components/molecules/RegionFilter";
import { StatusFilter } from "@/components/molecules/StatusFilter";
import { PriceFilter } from "@/components/molecules/PriceFilter";
import type { TagItem } from "@/types/tag";

type FilterSidebarProps = {
  tags: TagItem[];
  selectedTagIds: string[];
  onTagSelect: (id: string) => void;
  onTagSearch: (query: string) => void;
  tagSearchQuery: string;
  selectedRegion: string | null;
  selectedPrefecture: string | null;
  selectedCity: string | null;
  onRegionChange: (region: string | null) => void;
  onPrefectureChange: (prefecture: string | null) => void;
  onCityChange: (city: string | null) => void;
  expandedRegions: string[];
  expandedPrefectures: string[];
  onToggleRegion: (region: string) => void;
  onTogglePrefecture: (prefecture: string) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  freeOnly: boolean;
  onFreeOnlyChange: (free: boolean) => void;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onMinPriceChange: (price: number | undefined) => void;
  onMaxPriceChange: (price: number | undefined) => void;
  resultCount: number;
  onClearAll: () => void;
  onClear: () => void;
  onApply: () => void;
};

export function FilterSidebar({
  tags,
  selectedTagIds,
  onTagSelect,
  onTagSearch,
  tagSearchQuery,
  selectedRegion,
  selectedPrefecture,
  selectedCity,
  onRegionChange,
  onPrefectureChange,
  onCityChange,
  expandedRegions,
  expandedPrefectures,
  onToggleRegion,
  onTogglePrefecture,
  selectedStatuses,
  onStatusChange,
  freeOnly,
  onFreeOnlyChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  resultCount,
  onClearAll,
  onClear,
  onApply,
}: Readonly<FilterSidebarProps>) {
  return (
    <div className="bg-white border border-[#E3E8DF] rounded-[16px] shadow-[0px_2px_6px_rgba(39,46,36,0.08),0px_12px_28px_rgba(39,46,36,0.1)]">
      <div className="flex items-center justify-between h-[62px] px-5 border-b border-[#F1F4EE]">
        <h2 className="text-[17px] font-bold leading-[25px] text-[#272E24] font-[family-name:var(--font-zen-maru-gothic)]">
          絞り込み
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-bold leading-[17px] text-[#3868A3] hover:underline bg-transparent border-none p-0 cursor-pointer"
        >
          すべてクリア
        </button>
      </div>

      <div className="px-5 py-5 space-y-6">
        <TagFilter
          tags={tags}
          selectedIds={selectedTagIds}
          onTagSelect={onTagSelect}
          onSearch={onTagSearch}
          searchQuery={tagSearchQuery}
        />

        <RegionFilter
          selectedRegion={selectedRegion}
          selectedPrefecture={selectedPrefecture}
          selectedCity={selectedCity}
          onRegionChange={onRegionChange}
          onPrefectureChange={onPrefectureChange}
          onCityChange={onCityChange}
          expandedRegions={expandedRegions}
          expandedPrefectures={expandedPrefectures}
          onToggleRegion={onToggleRegion}
          onTogglePrefecture={onTogglePrefecture}
        />

        <StatusFilter
          selectedStatuses={selectedStatuses}
          onStatusChange={onStatusChange}
        />

        <PriceFilter
          freeOnly={freeOnly}
          onFreeOnlyChange={onFreeOnlyChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
        />
      </div>

      <div className="flex items-center h-[77px] px-5 border-t border-[#F1F4EE] gap-3">
        <button
          type="button"
          onClick={onClear}
          className="w-20 h-11 bg-white border border-[#CDD4C8] rounded-full text-sm font-bold leading-5 text-[#3A4237] text-center shrink-0 cursor-pointer"
        >
          クリア
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 h-11 bg-[#97C459] rounded-full text-[15px] font-bold leading-[22px] text-[#1E2C10] text-center cursor-pointer"
        >
          {resultCount}件を表示
        </button>
      </div>
    </div>
  );
}