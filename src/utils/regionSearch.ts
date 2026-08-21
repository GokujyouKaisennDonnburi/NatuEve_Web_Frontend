import { REGIONS } from "@/constants/regions";

// 候補1件分のデータ。漢字名とひらがなを持ち、どちらからでも検索できるようにする。
export type RegionOption = {
  readonly name: string;
  readonly hiragana: string;
};

// 候補のグループ。都道府県は地域単位、市区町村は都道府県単位でまとめる。
export type RegionOptionGroup = {
  readonly groupLabel: string;
  readonly options: readonly RegionOption[];
};

// 入力値に対して漢字・ひらがなのどちらかに部分一致するか判定する。
export const matchesRegionOption = (
  option: RegionOption,
  query: string,
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    option.name.toLowerCase().includes(q) ||
    option.hiragana.toLowerCase().includes(q)
  );
};

// 地域ごとにグループ化した都道府県の候補一覧を返す。
export function getPrefectureGroups(): RegionOptionGroup[] {
  return REGIONS.map((region) => ({
    groupLabel: region.name,
    options: region.prefectures.map((prefecture) => ({
      name: prefecture.name,
      hiragana: prefecture.hiragana,
    })),
  }));
}

// 選択中の都道府県に属する市区町村の候補グループを返す。
// 該当する都道府県が存在しない場合は空のグループを返す。
export function getCityGroup(prefectureName: string): RegionOptionGroup {
  const prefecture = REGIONS.flatMap((region) => region.prefectures).find(
    (p) => p.name === prefectureName,
  );
  return {
    groupLabel: prefecture?.name ?? "",
    options:
      prefecture?.cities.map((city) => ({
        name: city.name,
        hiragana: city.hiragana,
      })) ?? [],
  };
}

// 都道府県・市区町村・番地の入力値を location フィールドの値へ結合する。
// 空の項目は省き、区切り文字は入れない（例:「兵庫県神戸市中央区北野町」）。
export function buildLocation(
  prefecture: string,
  city: string,
  address: string,
): string {
  return [prefecture, city, address]
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .join("");
}
