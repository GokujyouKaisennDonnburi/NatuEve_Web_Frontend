export function formatNumber(value: number) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

// 全角数字を半角に直し、数字以外を取り除く。
// 定員数や金額など、数値だけを受け付ける入力欄で共有する。
export function normalizeHalfWidthDigits(value: string) {
  return value
    .replace(/[０-９]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xfee0),
    )
    .replace(/[^0-9]/g, "");
}
