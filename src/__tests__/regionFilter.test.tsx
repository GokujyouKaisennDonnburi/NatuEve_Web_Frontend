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

// チェックボックス行のボタンを取得する。
// 北海道は地域名と都道府県名が同一のため、先頭要素を地域行として扱う。
const filterButton = (name: string): HTMLElement =>
  screen.getAllByRole("button", { name })[0];

// 部分選択（indeterminate）のバーが表示されているかを判定する。
const isIndeterminate = (element: HTMLElement): boolean =>
  element.querySelector(".rounded-full") !== null;

// チェック（✓）が表示されているかを判定する。
const isChecked = (element: HTMLElement): boolean =>
  element.querySelector("svg") !== null;

describe("RegionFilter", () => {
  it("地域を選択しても同名の市区町村を持つ別の地域・都道府県は部分選択にならない", () => {
    render(<Harness />);

    fireEvent.click(filterButton("北海道"));

    expect(isChecked(filterButton("北海道"))).toBe(true);
    expect(isIndeterminate(filterButton("北海道"))).toBe(false);
    expect(isIndeterminate(filterButton("東北"))).toBe(false);
    expect(isIndeterminate(filterButton("福島県"))).toBe(false);
  });

  it("福島県の伊達市を個別に選択しても北海道側は選択されない", () => {
    render(
      <Harness
        initialCities={[]}
        // 北海道・福島県の両方に伊達市があることを確認するため、両方展開する
        expandedPrefectures={["北海道", "福島県"]}
      />,
    );

    const dateButtons = screen.getAllByRole("button", { name: "伊達市" });
    expect(dateButtons).toHaveLength(2);

    // 福島県側の伊達市を選択する
    fireEvent.click(dateButtons[1]);

    expect(isIndeterminate(filterButton("福島県"))).toBe(true);
    expect(isIndeterminate(filterButton("北海道"))).toBe(false);
    expect(
      isChecked(screen.getAllByRole("button", { name: "伊達市" })[0]),
    ).toBe(false);
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

    fireEvent.click(filterButton("伊達市"));

    expect(isIndeterminate(filterButton("北海道"))).toBe(true);
    expect(isChecked(filterButton("札幌市"))).toBe(true);
  });
});
