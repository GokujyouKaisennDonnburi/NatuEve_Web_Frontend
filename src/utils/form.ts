import type { KeyboardEvent } from "react";

// Enter を止める対象の input type。HTML 標準が「暗黙の送信を妨げる
// （blocks implicit submission）」コントロールとして列挙しているものに合わせた。
// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
//
// checkbox / radio でも Enter で送信するブラウザはあるが、対象の 3 フォームでは使っておらず、
// トグルなどの既定動作を潰す方が害が大きいため含めない。
const IMPLICIT_SUBMIT_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "date",
  "month",
  "week",
  "time",
  "datetime-local",
  "number",
]);

// 単一行 input で Enter を押すと発生する暗黙の送信だけを止める。
// textarea の改行、ボタンの Enter 実行、タグ欄や都道府県欄が自前で処理する Enter、
// IME 変換確定の Enter は壊さない。
export function preventImplicitSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  // type を書いていない input は type プロパティが "text" を返すため、そのまま対象になる。
  if (!IMPLICIT_SUBMIT_INPUT_TYPES.has(target.type)) {
    return;
  }
  event.preventDefault();
}
