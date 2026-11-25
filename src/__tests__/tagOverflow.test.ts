import { describe, expect, it } from "vitest";

import { calcVisibleTagCount } from "@/utils/tagOverflow";

const GAP = 4;

describe("calcVisibleTagCount", () => {
  it("すべてのタグが収まる場合は全件を返す", () => {
    expect(
      calcVisibleTagCount({
        tagWidths: [50, 60],
        containerWidth: 200,
        gap: GAP,
        chipWidth: 40,
      }),
    ).toBe(2);
  });

  it("ぎりぎり収まる場合も全件を返す", () => {
    // 50 + gap(4) + 60 = 114
    expect(
      calcVisibleTagCount({
        tagWidths: [50, 60],
        containerWidth: 114,
        gap: GAP,
        chipWidth: 40,
      }),
    ).toBe(2);
  });

  it("収まりきらない場合はチップ幅と gap を確保した上で収まる個数を返す", () => {
    // 1枚目 + チップ: 50 + gap(4) + 40 = 94
    expect(
      calcVisibleTagCount({
        tagWidths: [50, 60, 70],
        containerWidth: 100,
        gap: GAP,
        chipWidth: 40,
      }),
    ).toBe(1);
  });

  it("チップがまだ描画されていない場合(chipWidth 0)は暫定の個数を返す", () => {
    expect(
      calcVisibleTagCount({
        tagWidths: [50, 60, 70],
        containerWidth: 100,
        gap: GAP,
        chipWidth: 0,
      }),
    ).toBe(1);
  });

  it("チップ幅を確保すると 1 枚も入らない場合は 0 を返す", () => {
    // 暫定(chipWidth 0)では 1 枚入るが、実測チップ幅では入らないケース
    // 50 + gap(4) + 44 = 98 > 96
    expect(
      calcVisibleTagCount({
        tagWidths: [50, 60, 70],
        containerWidth: 96,
        gap: GAP,
        chipWidth: 44,
      }),
    ).toBe(0);
  });

  it("タグがない場合は 0 を返す", () => {
    expect(
      calcVisibleTagCount({
        tagWidths: [],
        containerWidth: 100,
        gap: GAP,
        chipWidth: 40,
      }),
    ).toBe(0);
  });
});
