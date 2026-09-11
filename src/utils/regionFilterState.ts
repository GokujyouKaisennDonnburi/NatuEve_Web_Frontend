import { ALL_PREFECTURES, REGIONS } from "@/constants/regions";

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

  for (const prefecture of ALL_PREFECTURES) {
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

  // 全都道府県を網羅する場合は location 自体を省略する。部分一致で全都道府県を
  // 指定しても全件に一致するだけのため、省略しても結果は同じ。
  if (ALL_PREFECTURES.every((prefecture) => values.has(prefecture.name))) {
    return [];
  }

  return Array.from(values);
}

// 地域フィルターの選択状態（地方・都道府県・市区町村の選択キー）。
export type RegionSelection = {
  regions: string[];
  prefectures: string[];
  // 市区町村は buildCityKey が生成する「都道府県名＋市区町村名」の複合キーで、
  // 同名の市区町村を都道府県ごとに区別する。
  // ブランド型などで名義型化せず string のまま扱うのは、selectedPrefectures 等の
  // 既存の選択状態設計（意味を持つ文字列を素の string で保持）との一貫性を優先するため。
  cities: string[];
};

// 地方・都道府県行のチェック状態（全選択・部分選択・未選択）。
export type RegionNodeStatus = "checked" | "indeterminate" | "unchecked";

// 市区町村の選択状態から都道府県・地方の選択状態を再計算する。
// 「配下が全て選択済みなら上位もチェック、1つでも欠ければ上位は解除」という条件を
// すべての操作後に満たすことで、上位チェックと実際の選択内容の不整合を防ぐ。
// 市区町村を持たない都道府県は市区町村から導出できないため、明示的な選択を維持する。
function syncAncestorSelection(
  currentPrefectures: readonly string[],
  cities: readonly string[],
): { regions: string[]; prefectures: string[] } {
  const prefectures = ALL_PREFECTURES.flatMap((prefecture) => {
    const selected =
      prefecture.cities.length === 0
        ? currentPrefectures.includes(prefecture.name)
        : prefecture.cities.every((city) =>
            cities.includes(buildCityKey(prefecture.name, city.name)),
          );
    return selected ? [prefecture.name] : [];
  });
  const regions = REGIONS.flatMap((region) =>
    region.prefectures.every((p) => prefectures.includes(p.name))
      ? [region.name]
      : [],
  );
  return { regions, prefectures };
}

// 地方の選択を反転する。選択時は配下の市区町村を全て選択へ展開し、解除時は全て解除する。
// 都道府県・地方の選択状態は syncAncestorSelection で配下の選択状況から再計算する。
export function toggleRegionInState(
  selection: RegionSelection,
  regionName: string,
): RegionSelection {
  const region = REGIONS.find((r) => r.name === regionName);
  if (!region) return selection;

  const regionCityKeys = region.prefectures.flatMap((p) =>
    p.cities.map((c) => buildCityKey(p.name, c.name)),
  );
  // 市区町村を持たない都道府県は市区町村経由で選択できないため、直接反転させる
  const lonePrefNames = region.prefectures
    .filter((p) => p.cities.length === 0)
    .map((p) => p.name);

  const isCurrentlySelected = selection.regions.includes(regionName);
  const cities = isCurrentlySelected
    ? selection.cities.filter((c) => !regionCityKeys.includes(c))
    : [...new Set([...selection.cities, ...regionCityKeys])];
  const currentPrefectures = isCurrentlySelected
    ? selection.prefectures.filter((p) => !lonePrefNames.includes(p))
    : [...new Set([...selection.prefectures, ...lonePrefNames])];

  return {
    ...syncAncestorSelection(currentPrefectures, cities),
    cities,
  };
}

// 都道府県の選択を反転する。選択時は配下の市区町村を全て選択へ展開し、解除時は全て解除する。
// 地方の選択状態は syncAncestorSelection で配下の選択状況から再計算する。
export function togglePrefectureInState(
  selection: RegionSelection,
  prefName: string,
): RegionSelection {
  const prefecture = ALL_PREFECTURES.find((p) => p.name === prefName);
  if (!prefecture) return selection;

  const prefCityKeys = prefecture.cities.map((c) =>
    buildCityKey(prefName, c.name),
  );
  const isCurrentlySelected = selection.prefectures.includes(prefName);
  const cities = isCurrentlySelected
    ? selection.cities.filter((c) => !prefCityKeys.includes(c))
    : [...new Set([...selection.cities, ...prefCityKeys])];
  // 市区町村を持たない都道府県は市区町村経由で選択できないため、直接反転させる
  const currentPrefectures =
    prefCityKeys.length > 0
      ? selection.prefectures
      : isCurrentlySelected
        ? selection.prefectures.filter((p) => p !== prefName)
        : [...selection.prefectures, prefName];

  return {
    ...syncAncestorSelection(currentPrefectures, cities),
    cities,
  };
}

// 市区町村の選択を反転する。都道府県・地方の選択状態は syncAncestorSelection で
// 配下の選択状況から再計算するため、全選択時の昇格・一部解除時の解除が自動的に追従する。
export function toggleCityInState(
  selection: RegionSelection,
  prefName: string,
  cityName: string,
): RegionSelection {
  const cityKey = buildCityKey(prefName, cityName);
  const cities = selection.cities.includes(cityKey)
    ? selection.cities.filter((c) => c !== cityKey)
    : [...selection.cities, cityKey];

  return {
    ...syncAncestorSelection(selection.prefectures, cities),
    cities,
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
  const prefecture = ALL_PREFECTURES.find((p) => p.name === prefName);
  if (!prefecture) return "unchecked";

  const hasCitySelected = prefecture.cities.some((c) =>
    selection.cities.includes(buildCityKey(prefName, c.name)),
  );
  if (hasCitySelected) return "indeterminate";
  return "unchecked";
}
