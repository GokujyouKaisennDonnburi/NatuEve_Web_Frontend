import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { RegionFilter } from "@/components/molecules/RegionFilter";

afterEach(cleanup);

// 実際の選択状態を反映するためのテスト用ラッパー。
// 北海道（伊達市・日高郡）と東北/福島県（伊達市）で同名の市区町村が発生する。
function Harness({
  initialRegions = [],
  initialPrefectures = [],
  initialCities = [],
  expandedPrefectures = ["福島県"],
}: {
  initialRegions?: string[];
  initialPrefectures?: string[];
  initialCities?: string[];
  expandedPrefectures?: string[];
}) {
  const [regions, setRegions] = useState<string[]>(initialRegions);
  const [prefectures, setPrefectures] = useState<string[]>(initialPrefectures);
  const [cities, setCities] = useState<string[]>(initialCities);

  return (
    <RegionFilter
      selectedRegions={regions}
      selectedPrefectures={prefectures}
      selectedCities={cities}
      onRegionsChange={setRegions}
      onPrefecturesChange={setPrefectures}
      onCitiesChange={setCities}
      expandedRegions={["北海道", "東北"]}
      expandedPrefectures={expandedPrefectures}
    />
  );
}

// チェックボックス行を名前で取得する。
// 地方行は「○○（地方）」、市区町村は「都道府県名＋市区町村名」の
// アクセシブルネームを持つため、階層や同名を区別して取得できる。
const filterCheckbox = (name: string): HTMLElement =>
  screen.getByRole("checkbox", { name });

// 部分選択（indeterminate）かを判定する。
const isIndeterminate = (element: HTMLElement): boolean =>
  element.getAttribute("aria-checked") === "mixed";

// チェック（全選択）かを判定する。
const isChecked = (element: HTMLElement): boolean =>
  element.getAttribute("aria-checked") === "true";

describe("RegionFilter", () => {
  it("地域を選択しても同名の市区町村を持つ別の地域・都道府県は部分選択にならない", () => {
    render(<Harness />);

    fireEvent.click(filterCheckbox("北海道（地方）"));

    expect(isChecked(filterCheckbox("北海道（地方）"))).toBe(true);
    expect(isIndeterminate(filterCheckbox("北海道（地方）"))).toBe(false);
    expect(isIndeterminate(filterCheckbox("東北（地方）"))).toBe(false);
    expect(isIndeterminate(filterCheckbox("福島県"))).toBe(false);
  });

  it("福島県の伊達市を個別に選択しても北海道側は選択されない", () => {
    render(
      <Harness
        initialCities={[]}
        // 北海道・福島県の両方に伊達市があることを確認するため、両方展開する
        expandedPrefectures={["北海道", "福島県"]}
      />,
    );

    // 複合キー名で両方の都道府県の伊達市を取得し、同名の市区町村が
    // 両方存在することを確認する
    const hokkaidoDate = filterCheckbox("北海道伊達市");
    const fukushimaDate = filterCheckbox("福島県伊達市");

    // 福島県側の伊達市を選択する
    fireEvent.click(fukushimaDate);

    expect(isIndeterminate(filterCheckbox("福島県"))).toBe(true);
    expect(isIndeterminate(filterCheckbox("北海道（地方）"))).toBe(false);
    expect(isChecked(hokkaidoDate)).toBe(false);
  });

  it("北海道の伊達市の選択を解除すると北海道側だけが解除される", () => {
    render(
      <Harness
        initialRegions={["北海道"]}
        initialPrefectures={["北海道"]}
        initialCities={["北海道伊達市", "北海道札幌市"]}
        expandedPrefectures={["北海道"]}
      />,
    );

    fireEvent.click(filterCheckbox("北海道伊達市"));

    expect(isIndeterminate(filterCheckbox("北海道（地方）"))).toBe(true);
    expect(isChecked(filterCheckbox("北海道札幌市"))).toBe(true);
  });

  it("解除した市区町村を再選択すると都道府県・地方のチェックが復活する", () => {
    render(<Harness />);

    fireEvent.click(filterCheckbox("東北（地方）"));
    expect(isChecked(filterCheckbox("福島県"))).toBe(true);

    fireEvent.click(filterCheckbox("福島県伊達市"));
    expect(isIndeterminate(filterCheckbox("福島県"))).toBe(true);
    expect(isIndeterminate(filterCheckbox("東北（地方）"))).toBe(true);

    fireEvent.click(filterCheckbox("福島県伊達市"));
    expect(isChecked(filterCheckbox("福島県"))).toBe(true);
    expect(isChecked(filterCheckbox("東北（地方）"))).toBe(true);
  });

  it("地方選択後に都道府県を1つ解除すると地方のチェックも外れる", () => {
    render(<Harness />);

    fireEvent.click(filterCheckbox("東北（地方）"));
    expect(isChecked(filterCheckbox("東北（地方）"))).toBe(true);

    fireEvent.click(filterCheckbox("福島県"));
    expect(isChecked(filterCheckbox("福島県"))).toBe(false);
    expect(isIndeterminate(filterCheckbox("東北（地方）"))).toBe(true);
  });
});
