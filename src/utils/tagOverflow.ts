type CalcVisibleTagCountParams = {
  // 並べるタグの実測幅(px)
  tagWidths: number[];
  // タグを並べられる領域の幅(px)
  containerWidth: number;
  // タグ同士・タグとチップの間隔(px)
  gap: number;
  // 「+N」チップの幅。まだ描画されていない場合は 0
  chipWidth: number;
};

// 固定幅のタグを横並びにしたとき、表示幅に入りきるタグの個数を求める。
// 全部は入りきらない場合は末尾に「+N」チップを表示するため、
// チップ幅とその分の gap も確保してから数える。
export function calcVisibleTagCount({
  tagWidths,
  containerWidth,
  gap,
  chipWidth,
}: CalcVisibleTagCountParams): number {
  const requiredWidth = (count: number, reservedWidth: number) => {
    let width = 0;
    for (let i = 0; i < count; i += 1) {
      width += tagWidths[i] + (i > 0 ? gap : 0);
    }
    return width + reservedWidth;
  };

  if (requiredWidth(tagWidths.length, 0) <= containerWidth) {
    return tagWidths.length;
  }

  let count = tagWidths.length;
  while (count > 0 && requiredWidth(count, gap + chipWidth) > containerWidth) {
    count -= 1;
  }
  return count;
}
