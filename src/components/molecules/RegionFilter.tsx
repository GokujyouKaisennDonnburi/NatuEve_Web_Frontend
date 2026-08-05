"use client";

import { cn } from "@/lib/utils";
import type { Region } from "@/constants/regions";
import { REGIONS } from "@/constants/regions";
import { ChevronDown } from "lucide-react";

type RegionFilterProps = {
  selectedRegion?: string | null;
  selectedPrefecture?: string | null;
  selectedCity?: string | null;
  onRegionChange?: (region: string | null) => void;
  onPrefectureChange?: (prefecture: string | null) => void;
  onCityChange?: (city: string | null) => void;
  expandedRegions?: string[];
  expandedPrefectures?: string[];
  onToggleRegion?: (region: string) => void;
  onTogglePrefecture?: (prefecture: string) => void;
  className?: string;
};

export function RegionFilter({
  selectedRegion = null,
  selectedPrefecture = null,
  selectedCity = null,
  onRegionChange,
  onPrefectureChange,
  onCityChange,
  expandedRegions = ["近畿"],
  expandedPrefectures = [],
  onToggleRegion,
  onTogglePrefecture,
  className,
}: Readonly<RegionFilterProps>) {
  const handleRegionClick = (regionName: string) => {
    if (selectedRegion === regionName) {
      onRegionChange?.(null);
      onPrefectureChange?.(null);
      onCityChange?.(null);
    } else {
      onRegionChange?.(regionName);
      onPrefectureChange?.(null);
      onCityChange?.(null);
    }
    onToggleRegion?.(regionName);
  };

  const handlePrefectureClick = (prefName: string) => {
    if (selectedPrefecture === prefName) {
      onPrefectureChange?.(null);
      onCityChange?.(null);
    } else {
      onPrefectureChange?.(prefName);
      onCityChange?.(null);
    }
    onTogglePrefecture?.(prefName);
  };

  const handleCityClick = (cityName: string) => {
    if (selectedCity === cityName) {
      onCityChange?.(null);
    } else {
      onCityChange?.(cityName);
    }
  };

  return (
    <div className={cn("", className)}>
      <span className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        地域
      </span>

      <div className="space-y-[2px]">
        {REGIONS.map((region: Region) => {
          const isRegionExpanded = expandedRegions.includes(region.name);
          const isRegionSelected = selectedRegion === region.name;

          return (
            <div key={region.name}>
              <button
                type="button"
                onClick={() => handleRegionClick(region.name)}
                className={cn(
                  "flex items-center w-full h-[22px] bg-white border border-[#CDD4C8] rounded-[6px] px-[8px] text-left",
                  isRegionSelected && "border-[#97C459]",
                )}
              >
                <span
                  className={cn(
                    "flex-1 text-sm leading-5 text-[#3A4237]",
                    "font-bold",
                  )}
                >
                  {region.name}
                </span>
                <ChevronDown
                  className={cn(
                    "h-[10px] w-[10px] text-[#A8B1A2] shrink-0 transition-transform",
                    isRegionExpanded && "rotate-180",
                  )}
                />
              </button>

              {isRegionExpanded && (
                <div className="ml-[22px] mt-[2px] space-y-[2px]">
                  {region.prefectures.map((pref) => {
                    const isPrefExpanded =
                      expandedPrefectures.includes(pref.name);
                    const isPrefSelected =
                      selectedPrefecture === pref.name;

                    return (
                      <div key={pref.name}>
                        <button
                          type="button"
                          onClick={() =>
                            handlePrefectureClick(pref.name)
                          }
                          className={cn(
                            "flex items-center w-full h-[22px] bg-white border border-[#CDD4C8] rounded-[6px] px-[8px] text-left",
                            isPrefSelected && "border-[#97C459]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex-1 text-sm leading-5 text-[#3A4237]",
                              isPrefSelected
                                ? "font-bold"
                                : "font-normal",
                            )}
                          >
                            {pref.name}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-[10px] w-[10px] text-[#A8B1A2] shrink-0 transition-transform",
                              isPrefExpanded && "rotate-180",
                            )}
                          />
                        </button>

                        {isPrefExpanded && (
                          <div className="ml-[22px] mt-[2px] flex flex-wrap gap-[2px]">
                            {pref.cities.map((city) => {
                              const isCitySelected =
                                selectedCity === city;
                              return (
                                <button
                                  key={city}
                                  type="button"
                                  onClick={() =>
                                    handleCityClick(city)
                                  }
                                  className={cn(
                                    "h-[22px] bg-white border border-[#CDD4C8] rounded-[6px] px-[8px] text-sm leading-5 text-[#3A4237] font-normal",
                                    isCitySelected &&
                                      "border-[#97C459] bg-[#97C459]/10 font-bold",
                                  )}
                                >
                                  {city}
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