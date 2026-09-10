import { describe, expect, it } from "vitest";
import { REGIONS } from "@/constants/regions";
import { buildCityKey, buildLocationFilters } from "@/utils/regionSearch";

const cityKeysOf = (prefectureName: string): string[] => {
  const prefecture = REGIONS.flatMap((region) => region.prefectures).find(
    (p) => p.name === prefectureName,
  );
  return (
    prefecture?.cities.map((city) =>
      buildCityKey(prefecture.name, city.name),
    ) ?? []
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
