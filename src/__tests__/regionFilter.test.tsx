import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegionFilter } from "@/components/molecules/RegionFilter";

afterEach(cleanup);

// 実際の選択状態を反映するためのテスト用ラッパー。
// 北海道（伊達市・日高郡）と東北/福島県（伊達市）で同名の市区町村が発生する。
function Harness({
  initialRegions = [],
  initialPrefectures = [],
  initialCities = [],
  expandedRegions = ["北海道", "東北"],
  expandedPrefectures = ["福島県"],
  onToggleRegion,
  onTogglePrefecture,
}: {
  initialRegions?: string[];
  initialPrefectures?: string[];
  initialCities?: string[];
  expandedRegions?: string[];
  expandedPrefectures?: string[];
  onToggleRegion?: (region: string) => void;
  onTogglePrefecture?: (prefecture: string) => void;
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
      expandedRegions={expandedRegions}
      expandedPrefectures={expandedPrefectures}
      onToggleRegion={onToggleRegion}
      onTogglePrefecture={onTogglePrefecture}
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

  it("地方を選択・選択解除してもトグルは自動で開閉しない", () => {
    const onToggleRegion = vi.fn();
    render(<Harness expandedRegions={[]} onToggleRegion={onToggleRegion} />);

    // 折りたたまれた状態では配下の都道府県は表示されない
    expect(
      screen.queryByRole("checkbox", { name: "福島県" }),
    ).not.toBeInTheDocument();

    fireEvent.click(filterCheckbox("東北（地方）"));
    expect(isChecked(filterCheckbox("東北（地方）"))).toBe(true);
    expect(onToggleRegion).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("checkbox", { name: "福島県" }),
    ).not.toBeInTheDocument();

    fireEvent.click(filterCheckbox("東北（地方）"));
    expect(isChecked(filterCheckbox("東北（地方）"))).toBe(false);
    expect(onToggleRegion).not.toHaveBeenCalled();
  });

  it("展開済みの地方を選択しても開いたままになる", () => {
    render(<Harness expandedRegions={["東北"]} />);

    expect(filterCheckbox("福島県")).toBeInTheDocument();

    fireEvent.click(filterCheckbox("東北（地方）"));
    expect(isChecked(filterCheckbox("東北（地方）"))).toBe(true);
    expect(filterCheckbox("福島県")).toBeInTheDocument();
  });

  it("都道府県を選択・選択解除してもトグルは自動で開閉しない", () => {
    const onTogglePrefecture = vi.fn();
    render(
      <Harness
        expandedRegions={["東北"]}
        expandedPrefectures={[]}
        onTogglePrefecture={onTogglePrefecture}
      />,
    );

    // 都道府県行は表示されているが、配下の市区町村は折りたたまれている
    expect(
      screen.queryByRole("checkbox", { name: "福島県伊達市" }),
    ).not.toBeInTheDocument();

    fireEvent.click(filterCheckbox("福島県"));
    expect(isChecked(filterCheckbox("福島県"))).toBe(true);
    expect(onTogglePrefecture).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("checkbox", { name: "福島県伊達市" }),
    ).not.toBeInTheDocument();

    fireEvent.click(filterCheckbox("福島県"));
    expect(isChecked(filterCheckbox("福島県"))).toBe(false);
    expect(onTogglePrefecture).not.toHaveBeenCalled();
  });

  it("トグル開閉コールバックは展開ボタンの操作時のみ呼ばれる", () => {
    const onToggleRegion = vi.fn();
    const onTogglePrefecture = vi.fn();
    render(
      <Harness
        onToggleRegion={onToggleRegion}
        onTogglePrefecture={onTogglePrefecture}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "東北（地方）を展開" }));
    expect(onToggleRegion).toHaveBeenCalledWith("東北");
    expect(onTogglePrefecture).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "福島県 を展開" }));
    expect(onTogglePrefecture).toHaveBeenCalledWith("福島県");
  });
});
