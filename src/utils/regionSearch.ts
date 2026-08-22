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
    groupLabel: prefecture?.name ?? prefectureName,
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

// イベント一覧の地域フィルターで選択された状態を API の location パラメータへ変換する。
// ・地域は直接送らず、その配下の都道府県名へ展開する（地方名は event.location に存在しないため）。
// ・都道府県が選択されている場合は都道府県名を送る。
// ・市区町村が一部だけ選択されている場合は「都道府県名＋市区町村名」を送る（親都道府県名を前置）。
//   （府中市のように複数の都道府県に同名の市区町村が存在するため、部分一致の誤ヒットを避ける）
// ・市区町村が全件選択されている場合は、地域マスタと照合して都道府県1件にまとめる。
// ・最後に重複を除去する。
export function buildLocationFilters(
  regions: readonly string[],
  prefectures: readonly string[],
  cities: readonly string[],
): string[] {
  const values = new Set<string>();

  for (const region of REGIONS) {
    for (const prefecture of region.prefectures) {
      // 都道府県が選択されているか（直接選択、または選択した地域の配下）
      const prefectureSelected =
        prefectures.includes(prefecture.name) || regions.includes(region.name);

      // 地域マスタの全市区町村と照合して、選択済みの市区町村を求める
      const selectedCities = prefecture.cities.filter((city) =>
        cities.includes(city.name),
      );

      if (
        prefecture.cities.length > 0 &&
        selectedCities.length === prefecture.cities.length
      ) {
        // 市区町村が全件選択されている場合は都道府県1件にまとめる
        values.add(prefecture.name);
      } else if (selectedCities.length > 0) {
        // 一部選択の場合は都道府県名を前置（都道府県と同時選択があっても市区町村を優先）
        for (const city of selectedCities) {
          values.add(`${prefecture.name}${city.name}`);
        }
      } else if (prefectureSelected) {
        values.add(prefecture.name);
      }
    }
  }

  return Array.from(values);
}
