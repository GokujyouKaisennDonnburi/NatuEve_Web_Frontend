"use client";

import { cn } from "@/lib/utils";
import type { Region } from "@/constants/regions";
import { REGIONS } from "@/constants/regions";
import {
  buildCityKey,
  getPrefectureStatus,
  getRegionStatus,
  toggleCityInState,
  togglePrefectureInState,
  toggleRegionInState,
  type RegionSelection,
} from "@/utils/regionSearch";
import { ChevronDown } from "lucide-react";

type RegionFilterProps = {
  selectedRegions?: string[];
  selectedPrefectures?: string[];
  selectedCities?: string[];
  onRegionsChange?: (regions: string[]) => void;
  onPrefecturesChange?: (prefectures: string[]) => void;
  onCitiesChange?: (cities: string[]) => void;
  expandedRegions?: string[];
  expandedPrefectures?: string[];
  onToggleRegion?: (region: string) => void;
  onTogglePrefecture?: (prefecture: string) => void;
  className?: string;
};

function Checkbox({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-[3px] border shrink-0",
        checked || indeterminate
          ? "bg-[#97C459] border-[#97C459]"
          : "bg-white border-[#CDD4C8]",
      )}
    >
      {indeterminate ? (
        <span className="w-2 h-[2px] bg-white rounded-full" />
      ) : checked ? (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

export function RegionFilter({
  selectedRegions = [],
  selectedPrefectures = [],
  selectedCities = [],
  onRegionsChange,
  onPrefecturesChange,
  onCitiesChange,
  expandedRegions = [],
  expandedPrefectures = [],
  onToggleRegion,
  onTogglePrefecture,
  className,
}: Readonly<RegionFilterProps>) {
  const selection: RegionSelection = {
    regions: selectedRegions,
    prefectures: selectedPrefectures,
    cities: selectedCities,
  };

  // 純粋関数で算出した次の選択状態をそのまま親へ渡す
  const applySelection = (next: RegionSelection) => {
    onRegionsChange?.(next.regions);
    onPrefecturesChange?.(next.prefectures);
    onCitiesChange?.(next.cities);
  };

  const toggleRegion = (regionName: string) => {
    applySelection(toggleRegionInState(selection, regionName));
    onToggleRegion?.(regionName);
  };

  const togglePrefecture = (prefName: string) => {
    applySelection(togglePrefectureInState(selection, prefName));
    onTogglePrefecture?.(prefName);
  };

  const toggleCity = (prefName: string, cityName: string) => {
    applySelection(toggleCityInState(selection, prefName, cityName));
  };

  return (
    <div className={cn("", className)}>
      <span className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        地域
      </span>

      <div className="space-y-[2px]">
        {REGIONS.map((region: Region) => {
          const regionStatus = getRegionStatus(selection, region.name);
          const isRegionExpanded = expandedRegions.includes(region.name);

          return (
            <div key={region.name}>
              <div className="relative w-full h-[22px]">
                <button
                  type="button"
                  onClick={() => toggleRegion(region.name)}
                  className="flex items-center w-full h-full bg-transparent pl-[8px] pr-[18px] text-left cursor-pointer"
                >
                  <Checkbox
                    checked={regionStatus === "checked"}
                    indeterminate={regionStatus === "indeterminate"}
                  />
                  <span
                    className={cn(
                      "flex-1 ml-[6px] text-sm leading-5 text-[#3A4237] font-bold",
                    )}
                  >
                    {region.name}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRegion?.(region.name);
                  }}
                  aria-label={`${region.name} を展開`}
                  className="absolute top-0 right-[8px] flex items-center justify-center w-[10px] h-full bg-transparent border-none p-0 cursor-pointer"
                >
                  <ChevronDown
                    className={cn(
                      "h-[10px] w-[10px] text-[#A8B1A2] shrink-0 transition-transform",
                      isRegionExpanded && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {isRegionExpanded && (
                <div className="ml-[22px] mt-[2px] space-y-[2px]">
                  {region.prefectures.map((pref) => {
                    const prefStatus = getPrefectureStatus(
                      selection,
                      pref.name,
                    );
                    const isPrefExpanded = expandedPrefectures.includes(
                      pref.name,
                    );

                    return (
                      <div key={pref.name}>
                        <div className="relative w-full h-[22px]">
                          <button
                            type="button"
                            onClick={() => togglePrefecture(pref.name)}
                            className="flex items-center w-full h-full bg-transparent pl-[8px] pr-[18px] text-left cursor-pointer"
                          >
                            <Checkbox
                              checked={prefStatus === "checked"}
                              indeterminate={prefStatus === "indeterminate"}
                            />
                            <span
                              className={cn(
                                "flex-1 ml-[6px] text-sm leading-5 text-[#3A4237]",
                                prefStatus !== "unchecked"
                                  ? "font-bold"
                                  : "font-normal",
                              )}
                            >
                              {pref.name}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePrefecture?.(pref.name);
                            }}
                            aria-label={`${pref.name} を展開`}
                            className="absolute top-0 right-[8px] flex items-center justify-center w-[10px] h-full bg-transparent border-none p-0 cursor-pointer"
                          >
                            <ChevronDown
                              className={cn(
                                "h-[10px] w-[10px] text-[#A8B1A2] shrink-0 transition-transform",
                                isPrefExpanded && "rotate-180",
                              )}
                            />
                          </button>
                        </div>

                        {isPrefExpanded && (
                          <div className="ml-[22px] mt-[2px] flex flex-wrap gap-[2px]">
                            {pref.cities.map((city) => {
                              const isCitySelected = selectedCities.includes(
                                buildCityKey(pref.name, city.name),
                              );
                              return (
                                <button
                                  key={city.name}
                                  type="button"
                                  onClick={() =>
                                    toggleCity(pref.name, city.name)
                                  }
                                  className={cn(
                                    "flex items-center h-[22px] bg-transparent px-[8px] text-sm leading-5 text-[#3A4237] font-normal",
                                    isCitySelected && "font-bold",
                                  )}
                                >
                                  <Checkbox checked={isCitySelected} />
                                  <span className="ml-[6px]">{city.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
