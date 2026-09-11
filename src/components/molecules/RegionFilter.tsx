"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Region } from "@/constants/regions";
import { REGIONS } from "@/constants/regions";
import {
  buildCityKey,
  getPrefectureStatus,
  getRegionStatus,
  toggleCityInState,
  togglePrefectureInState,
  toggleRegionInState,
  type RegionNodeStatus,
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

// チェック状態（全選択・部分選択・未選択）を Checkbox の checked 値へ変換する
const toCheckedState = (
  status: RegionNodeStatus,
): boolean | "indeterminate" => {
  if (status === "checked") return true;
  if (status === "indeterminate") return "indeterminate";
  return false;
};

// サイドバーの既存デザインに合わせたチェックボックスの見た目
// （未選択: 白地にグレー枠、全選択・部分選択: 緑地）
const CHECKBOX_CLASS =
  "cursor-pointer rounded-[3px] border-[#CDD4C8] bg-white shadow-none data-[state=checked]:border-[#97C459] data-[state=checked]:bg-[#97C459] data-[state=checked]:text-white data-[state=indeterminate]:border-[#97C459] data-[state=indeterminate]:bg-[#97C459] data-[state=indeterminate]:text-white";

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
  // チェックボックスと Label を id/htmlFor で関連付けるための接頭辞
  const filterId = useId();
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
          // 地方と都道府県が同名（北海道）でも id が重複しないよう階層種別を含める
          const regionCheckboxId = `${filterId}-region-${region.name}`;

          return (
            <div key={region.name}>
              <div className="relative w-full h-[22px]">
                <div className="flex items-center w-full h-full pl-[8px] pr-[18px]">
                  <Checkbox
                    id={regionCheckboxId}
                    checked={toCheckedState(regionStatus)}
                    onCheckedChange={() => toggleRegion(region.name)}
                    className={CHECKBOX_CLASS}
                  />
                  <Label
                    htmlFor={regionCheckboxId}
                    className="flex-1 ml-[6px] text-sm leading-5 text-[#3A4237] font-bold cursor-pointer"
                  >
                    {region.name}
                  </Label>
                </div>

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
                    const prefCheckboxId = `${filterId}-pref-${pref.name}`;

                    return (
                      <div key={pref.name}>
                        <div className="relative w-full h-[22px]">
                          <div className="flex items-center w-full h-full pl-[8px] pr-[18px]">
                            <Checkbox
                              id={prefCheckboxId}
                              checked={toCheckedState(prefStatus)}
                              onCheckedChange={() =>
                                togglePrefecture(pref.name)
                              }
                              className={CHECKBOX_CLASS}
                            />
                            <Label
                              htmlFor={prefCheckboxId}
                              className={cn(
                                "flex-1 ml-[6px] text-sm leading-5 text-[#3A4237] cursor-pointer",
                                prefStatus !== "unchecked"
                                  ? "font-bold"
                                  : "font-normal",
                              )}
                            >
                              {pref.name}
                            </Label>
                          </div>

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
                              const cityCheckboxId = `${filterId}-city-${pref.name}-${city.name}`;
                              return (
                                <div
                                  key={city.name}
                                  className="flex items-center h-[22px] px-[8px]"
                                >
                                  <Checkbox
                                    id={cityCheckboxId}
                                    checked={isCitySelected}
                                    onCheckedChange={() =>
                                      toggleCity(pref.name, city.name)
                                    }
                                    className={CHECKBOX_CLASS}
                                  />
                                  <Label
                                    htmlFor={cityCheckboxId}
                                    className={cn(
                                      "ml-[6px] text-sm leading-5 text-[#3A4237] font-normal cursor-pointer",
                                      isCitySelected && "font-bold",
                                    )}
                                  >
                                    {city.name}
                                  </Label>
                                </div>
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
