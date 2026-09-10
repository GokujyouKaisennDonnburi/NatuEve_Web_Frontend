import { REGIONS } from "@/constants/regions";

// 候補1件分のデータ。漢字名とひらがなを持ち、どちらからでも検索できるようにする。
// ひらがなは複数読みに対応するため配列で持つ。
export type RegionOption = {
  readonly name: string;
  readonly hiragana: readonly string[];
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
    option.hiragana.some((hiragana) => hiragana.toLowerCase().includes(q))
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
        hiragana: [city.hiragana],
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

// 市区町村を都道府県とセットで一意に識別するためのキーを返す。
// 府中市や伊達市のように複数の都道府県に同名の市区町村が存在するため、親都道府県名を前置する。
// location パラメータ（例: 福島県伊達市）と同じ形式で表現する。
export function buildCityKey(prefecture: string, city: string): string {
  return `${prefecture}${city}`;
}

// イベント一覧の地域フィルターで選択された状態を API の location パラメータへ変換する。
// ・都道府県が選択されている場合は都道府県名を送る。
//   地域の選択は selectedPrefectures へ配下の都道府県が展開されるため、ここでは
//   selectedPrefectures を選択の実体として扱う（地域で個別に解除された都道府県は含めない）。
// ・市区町村が一部だけ選択されている場合は「都道府県名＋市区町村名」を送る（親都道府県名を前置）。
//   選択状態も buildCityKey のキーで管理するため、同名の市区町村でも都道府県ごとに区別できる。
// ・市区町村が全件選択されている場合は、地域マスタと照合して都道府県1件にまとめる。
// ・最後に重複を除去する。
// ・全都道府県を網羅する（全国すべて）選択の場合は、絞り込みが意味をなさないため
//   空配列を返し、呼び出し側で location パラメータ自体を省略させる。
export function buildLocationFilters(
  prefectures: readonly string[],
  cities: readonly string[],
): string[] {
  const values = new Set<string>();

  for (const region of REGIONS) {
    for (const prefecture of region.prefectures) {
      // 都道府県が直接選択されているか。
      // 地域が選択された場合も配下の都道府県は selectedPrefectures へ投入されるため、
      // ここで地域は参照しない（個別に解除された都道府県は含めない）。
      const prefectureSelected = prefectures.includes(prefecture.name);

      // 地域マスタの全市区町村と照合して、選択済みの市区町村を求める
      const selectedCities = prefecture.cities.filter((city) =>
        cities.includes(buildCityKey(prefecture.name, city.name)),
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

  // 全都道府県を網羅する場合は location 自体を省略する。部分一致で全都道府県を
  // 指定しても全件に一致するだけのため、省略しても結果は同じ。
  const allPrefectures = REGIONS.flatMap((region) => region.prefectures);
  if (allPrefectures.every((prefecture) => values.has(prefecture.name))) {
    return [];
  }

  return Array.from(values);
}

// 地域フィルターの選択状態（地方・都道府県・市区町村の選択キー）。
// 市区町村は同名の市区町村を都道府県ごとに区別するため、buildCityKey の複合キーで保持する。
export type RegionSelection = {
  regions: string[];
  prefectures: string[];
  cities: string[];
};

// 地方・都道府県行のチェック状態（全選択・部分選択・未選択）。
export type RegionNodeStatus = "checked" | "indeterminate" | "unchecked";

// 地方の選択を反転する。選択時は配下の都道府県・市区町村を全て選択へ展開し、
// 解除時は配下を全て解除する。
export function toggleRegionInState(
  selection: RegionSelection,
  regionName: string,
): RegionSelection {
  const region = REGIONS.find((r) => r.name === regionName);
  if (!region) return selection;

  if (selection.regions.includes(regionName)) {
    const allPrefs = region.prefectures.map((p) => p.name);
    const allCityKeys = region.prefectures.flatMap((p) =>
      p.cities.map((c) => buildCityKey(p.name, c.name)),
    );
    return {
      regions: selection.regions.filter((r) => r !== regionName),
      prefectures: selection.prefectures.filter((p) => !allPrefs.includes(p)),
      cities: selection.cities.filter((c) => !allCityKeys.includes(c)),
    };
  }

  const newPrefs = region.prefectures
    .map((p) => p.name)
    .filter((p) => !selection.prefectures.includes(p));
  const newCityKeys = region.prefectures
    .flatMap((p) => p.cities.map((c) => buildCityKey(p.name, c.name)))
    .filter((c) => !selection.cities.includes(c));
  return {
    regions: [...selection.regions, regionName],
    prefectures: [...selection.prefectures, ...newPrefs],
    cities: [...selection.cities, ...newCityKeys],
  };
}

// 都道府県の選択を反転する。選択時は配下の市区町村を全て選択へ展開し、
// 解除時は配下を全て解除する。
export function togglePrefectureInState(
  selection: RegionSelection,
  prefName: string,
): RegionSelection {
  const prefecture = REGIONS.flatMap((region) => region.prefectures).find(
    (p) => p.name === prefName,
  );
  if (!prefecture) return selection;

  if (selection.prefectures.includes(prefName)) {
    return {
      regions: selection.regions,
      prefectures: selection.prefectures.filter((p) => p !== prefName),
      cities: selection.cities.filter(
        (c) =>
          !prefecture.cities.some(
            (city) => buildCityKey(prefName, city.name) === c,
          ),
      ),
    };
  }

  const newCityKeys = prefecture.cities
    .map((c) => buildCityKey(prefName, c.name))
    .filter((c) => !selection.cities.includes(c));
  return {
    regions: selection.regions,
    prefectures: [...selection.prefectures, prefName],
    cities: [...selection.cities, ...newCityKeys],
  };
}

// 市区町村の選択を反転する。解除した市区町村の親の都道府県・地方は
// 全選択の条件を満たさなくなるため、選択から併せて外す。
export function toggleCityInState(
  selection: RegionSelection,
  prefName: string,
  cityName: string,
): RegionSelection {
  const cityKey = buildCityKey(prefName, cityName);
  if (!selection.cities.includes(cityKey)) {
    return {
      regions: selection.regions,
      prefectures: selection.prefectures,
      cities: [...selection.cities, cityKey],
    };
  }

  const region = REGIONS.find((r) =>
    r.prefectures.some((p) => p.name === prefName),
  );
  if (!region) return selection;
  return {
    regions: selection.regions.includes(region.name)
      ? selection.regions.filter((r) => r !== region.name)
      : selection.regions,
    prefectures: selection.prefectures.includes(prefName)
      ? selection.prefectures.filter((p) => p !== prefName)
      : selection.prefectures,
    cities: selection.cities.filter((c) => c !== cityKey),
  };
}

// 地方行のチェック状態を返す。地方として選択済みなら全選択、配下の
// 都道府県・市区町村が1つでも選択済みなら部分選択、それ以外は未選択。
export function getRegionStatus(
  selection: RegionSelection,
  regionName: string,
): RegionNodeStatus {
  const region = REGIONS.find((r) => r.name === regionName);
  if (!region) return "unchecked";
  const allPrefs = region.prefectures.map((p) => p.name);
  const allCityKeys = region.prefectures.flatMap((p) =>
    p.cities.map((c) => buildCityKey(p.name, c.name)),
  );

  let selectedCount = 0;
  for (const p of allPrefs) {
    if (selection.prefectures.includes(p)) selectedCount++;
  }
  for (const c of allCityKeys) {
    if (selection.cities.includes(c)) selectedCount++;
  }

  if (selection.regions.includes(regionName)) return "checked";
  if (selectedCount > 0) return "indeterminate";
  return "unchecked";
}

// 都道府県行のチェック状態を返す。都道府県として選択済みなら全選択、
// 配下の市区町村が1つでも選択済みなら部分選択、それ以外は未選択。
export function getPrefectureStatus(
  selection: RegionSelection,
  prefName: string,
): RegionNodeStatus {
  if (selection.prefectures.includes(prefName)) return "checked";
  const prefecture = REGIONS.flatMap((region) => region.prefectures).find(
    (p) => p.name === prefName,
  );
  if (!prefecture) return "unchecked";

  const hasCitySelected = prefecture.cities.some((c) =>
    selection.cities.includes(buildCityKey(prefName, c.name)),
  );
  if (hasCitySelected) return "indeterminate";
  return "unchecked";
}
