import { describe, expect, it } from "vitest";
import { REGIONS } from "@/constants/regions";
import {
  buildCityKey,
  buildLocationFilters,
  getPrefectureStatus,
  getRegionStatus,
  toggleCityInState,
  togglePrefectureInState,
  toggleRegionInState,
  type RegionSelection,
} from "@/utils/regionFilterState";

const EMPTY: RegionSelection = { regions: [], prefectures: [], cities: [] };

const cityKeysOf = (prefectureName: string): string[] => {
  const prefecture = REGIONS.flatMap((region) => region.prefectures).find(
    (p) => p.name === prefectureName,
  );
  if (!prefecture) return [];
  return prefecture.cities.map((city) =>
    buildCityKey(prefecture.name, city.name),
  );
};

const prefNamesOf = (regionName: string): string[] => {
  const region = REGIONS.find((r) => r.name === regionName);
  if (!region) return [];
  return region.prefectures.map((p) => p.name);
};

const cityKeysOfRegion = (regionName: string): string[] => {
  const region = REGIONS.find((r) => r.name === regionName);
  if (!region) return [];
  return region.prefectures.flatMap((p) =>
    p.cities.map((c) => buildCityKey(p.name, c.name)),
  );
};

describe("buildCityKey", () => {
  it("都道府県名を前置して同名の市区町村を区別する", () => {
    expect(buildCityKey("北海道", "伊達市")).toBe("北海道伊達市");
    expect(buildCityKey("福島県", "伊達市")).toBe("福島県伊達市");
  });
});

describe("buildLocationFilters", () => {
  it("同名の市区町村があっても選択した都道府県のものだけを返す", () => {
    expect(buildLocationFilters([], ["北海道伊達市"])).toEqual([
      "北海道伊達市",
    ]);
    expect(buildLocationFilters([], ["福島県伊達市"])).toEqual([
      "福島県伊達市",
    ]);
    expect(buildLocationFilters([], ["北海道伊達市", "福島県伊達市"])).toEqual([
      "北海道伊達市",
      "福島県伊達市",
    ]);
  });

  it("市区町村が一部だけ選択されている場合は都道府県名を前置したまま返す", () => {
    const cities = cityKeysOf("北海道").slice(0, 2);
    expect(buildLocationFilters([], cities)).toEqual(cities);
  });

  it("全市区町村が選択されている場合は都道府県1件にまとめる", () => {
    expect(buildLocationFilters([], cityKeysOf("福島県"))).toEqual(["福島県"]);
  });

  it("全都道府県を網羅する場合は空配列を返す", () => {
    const prefectures = REGIONS.flatMap((region) => region.prefectures).map(
      (p) => p.name,
    );
    expect(buildLocationFilters(prefectures, [])).toEqual([]);
  });
});

describe("toggleRegionInState", () => {
  it("地方を選択すると配下の都道府県と市区町村を全て展開する", () => {
    const next = toggleRegionInState(EMPTY, "東北");
    expect(next.regions).toEqual(["東北"]);
    expect(next.prefectures).toEqual(prefNamesOf("東北"));
    expect(next.cities).toEqual(cityKeysOfRegion("東北"));
  });

  it("地方の選択を解除すると配下を全て解除する", () => {
    const selected = toggleRegionInState(EMPTY, "東北");
    expect(toggleRegionInState(selected, "東北")).toEqual(EMPTY);
  });

  it("同名の市区町村を持つ他の地域の市区町村は選択しない", () => {
    const next = toggleRegionInState(EMPTY, "東北");
    expect(next.cities).toContain("福島県伊達市");
    expect(next.cities).not.toContain("北海道伊達市");
  });
});

describe("togglePrefectureInState", () => {
  it("都道府県を選択すると配下の市区町村を全て展開する", () => {
    const next = togglePrefectureInState(EMPTY, "福島県");
    expect(next.prefectures).toEqual(["福島県"]);
    expect(next.cities).toEqual(cityKeysOf("福島県"));
    expect(next.regions).toEqual([]);
  });

  it("都道府県の選択を解除すると配下の市区町村も解除する", () => {
    const selected = togglePrefectureInState(EMPTY, "福島県");
    const next = togglePrefectureInState(selected, "福島県");
    expect(next.prefectures).toEqual([]);
    expect(next.cities).toEqual([]);
  });

  it("配下の都道府県を個別に全て選択すると地方のチェックが付く", () => {
    const next = prefNamesOf("東北").reduce(
      (selection, prefName) => togglePrefectureInState(selection, prefName),
      EMPTY,
    );
    expect(next.regions).toContain("東北");
  });

  it("地方選択後に都道府県を1つ解除すると地方のチェックも外れる", () => {
    const selected = toggleRegionInState(EMPTY, "東北");
    const next = togglePrefectureInState(selected, "福島県");
    expect(next.prefectures).not.toContain("福島県");
    expect(next.prefectures).toContain("青森県");
    expect(next.regions).not.toContain("東北");
  });
});

describe("toggleCityInState", () => {
  it("市区町村を選択すると市区町村のみ追加される", () => {
    const next = toggleCityInState(EMPTY, "福島県", "伊達市");
    expect(next.cities).toEqual(["福島県伊達市"]);
    expect(next.prefectures).toEqual([]);
    expect(next.regions).toEqual([]);
  });

  it("市区町村を解除すると親の都道府県・地方の選択も外れる", () => {
    const selected = {
      regions: ["北海道"],
      prefectures: ["北海道"],
      cities: cityKeysOf("北海道"),
    };
    const next = toggleCityInState(selected, "北海道", "伊達市");
    expect(next.cities).not.toContain("北海道伊達市");
    expect(next.prefectures).toEqual([]);
    expect(next.regions).toEqual([]);
  });

  it("解除した市区町村を再選択すると都道府県と地方のチェックが復活する", () => {
    const selected = toggleRegionInState(EMPTY, "東北");
    const deselected = toggleCityInState(selected, "福島県", "伊達市");
    expect(deselected.prefectures).not.toContain("福島県");
    expect(deselected.regions).not.toContain("東北");

    const reselected = toggleCityInState(deselected, "福島県", "伊達市");
    expect(reselected.prefectures).toContain("福島県");
    expect(reselected.regions).toContain("東北");
  });
});

describe("getRegionStatus / getPrefectureStatus", () => {
  it("地方は選択済みで全選択、配下の一部選択で部分選択になる", () => {
    const selected = toggleRegionInState(EMPTY, "東北");
    expect(getRegionStatus(selected, "東北")).toBe("checked");
    const partial = togglePrefectureInState(EMPTY, "福島県");
    expect(getRegionStatus(partial, "東北")).toBe("indeterminate");
    expect(getRegionStatus(EMPTY, "東北")).toBe("unchecked");
  });

  it("都道府県は選択済みで全選択、配下の一部選択で部分選択になる", () => {
    const selected = togglePrefectureInState(EMPTY, "福島県");
    expect(getPrefectureStatus(selected, "福島県")).toBe("checked");
    const partial = toggleCityInState(EMPTY, "福島県", "伊達市");
    expect(getPrefectureStatus(partial, "福島県")).toBe("indeterminate");
    expect(getPrefectureStatus(EMPTY, "福島県")).toBe("unchecked");
  });
});
