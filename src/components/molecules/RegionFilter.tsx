"use client";

import { cn } from "@/lib/utils";
import type { Region } from "@/constants/regions";
import { REGIONS } from "@/constants/regions";
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
  expandedRegions = ["近畿"],
  expandedPrefectures = [],
  onToggleRegion,
  onTogglePrefecture,
  className,
}: Readonly<RegionFilterProps>) {
  const toggleRegion = (regionName: string) => {
    const region = REGIONS.find((r) => r.name === regionName);
    if (!region) return;

    const isCurrentlySelected = selectedRegions.includes(regionName);

    if (isCurrentlySelected) {
      const allPrefs = region.prefectures.map((p) => p.name);
      const allCities = region.prefectures.flatMap((p) => p.cities);
      onRegionsChange?.(selectedRegions.filter((r) => r !== regionName));
      onPrefecturesChange?.(
        selectedPrefectures.filter((p) => !allPrefs.includes(p)),
      );
      onCitiesChange?.(selectedCities.filter((c) => !allCities.includes(c)));
    } else {
      const newPrefs = region.prefectures
        .map((p) => p.name)
        .filter((p) => !selectedPrefectures.includes(p));
      const newCities = region.prefectures
        .flatMap((p) => p.cities)
        .filter((c) => !selectedCities.includes(c));
      onRegionsChange?.([...selectedRegions, regionName]);
      onPrefecturesChange?.([...selectedPrefectures, ...newPrefs]);
      onCitiesChange?.([...selectedCities, ...newCities]);
    }
    onToggleRegion?.(regionName);
  };

  const togglePrefecture = (regionName: string, prefName: string) => {
    const region = REGIONS.find((r) => r.name === regionName);
    if (!region) return;
    const pref = region.prefectures.find((p) => p.name === prefName);
    if (!pref) return;

    const isCurrentlySelected = selectedPrefectures.includes(prefName);

    if (isCurrentlySelected) {
      onPrefecturesChange?.(selectedPrefectures.filter((p) => p !== prefName));
      onCitiesChange?.(selectedCities.filter((c) => !pref.cities.includes(c)));
    } else {
      const newCities = pref.cities.filter((c) => !selectedCities.includes(c));
      onPrefecturesChange?.([...selectedPrefectures, prefName]);
      onCitiesChange?.([...selectedCities, ...newCities]);
    }
    onTogglePrefecture?.(prefName);
  };

  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      onCitiesChange?.(selectedCities.filter((c) => c !== cityName));
    } else {
      onCitiesChange?.([...selectedCities, cityName]);
    }
  };

  const getRegionStatus = (
    regionName: string,
  ): "checked" | "indeterminate" | "unchecked" => {
    const region = REGIONS.find((r) => r.name === regionName);
    if (!region) return "unchecked";
    const allPrefs = region.prefectures.map((p) => p.name);
    const allCities = region.prefectures.flatMap((p) => p.cities);

    let selectedCount = 0;
    for (const p of allPrefs) {
      if (selectedPrefectures.includes(p)) selectedCount++;
    }
    for (const c of allCities) {
      if (selectedCities.includes(c)) selectedCount++;
    }

    if (selectedRegions.includes(regionName)) return "checked";
    if (selectedCount > 0) return "indeterminate";
    return "unchecked";
  };

  const getPrefStatus = (
    prefName: string,
  ): "checked" | "indeterminate" | "unchecked" => {
    if (selectedPrefectures.includes(prefName)) return "checked";
    const region = REGIONS.find((r) =>
      r.prefectures.some((p) => p.name === prefName),
    );
    if (!region) return "unchecked";
    const pref = region.prefectures.find((p) => p.name === prefName);
    if (!pref) return "unchecked";

    const hasCitySelected = pref.cities.some((c) => selectedCities.includes(c));
    if (hasCitySelected) return "indeterminate";
    return "unchecked";
  };

  return (
    <div className={cn("", className)}>
      <span className="block text-xs font-bold leading-[17px] text-[#838C7D] mb-2">
        地域
      </span>

      <div className="space-y-[2px]">
        {REGIONS.map((region: Region) => {
          const regionStatus = getRegionStatus(region.name);
          const isRegionExpanded = expandedRegions.includes(region.name);

          return (
            <div key={region.name}>
              <button
                type="button"
                onClick={() => toggleRegion(region.name)}
                className={cn(
                  "flex items-center w-full h-[22px] bg-transparent px-[8px] text-left",
                )}
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
                    const prefStatus = getPrefStatus(pref.name);
                    const isPrefExpanded = expandedPrefectures.includes(
                      pref.name,
                    );

                    return (
                      <div key={pref.name}>
                        <button
                          type="button"
                          onClick={() =>
                            togglePrefecture(region.name, pref.name)
                          }
                          className={cn(
                            "flex items-center w-full h-[22px] bg-transparent px-[8px] text-left",
                          )}
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
                                selectedCities.includes(city);
                              return (
                                <button
                                  key={city}
                                  type="button"
                                  onClick={() => toggleCity(city)}
                                  className={cn(
                                    "flex items-center h-[22px] bg-transparent px-[8px] text-sm leading-5 text-[#3A4237] font-normal",
                                    isCitySelected && "font-bold",
                                  )}
                                >
                                  <Checkbox checked={isCitySelected} />
                                  <span className="ml-[6px]">{city}</span>
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
