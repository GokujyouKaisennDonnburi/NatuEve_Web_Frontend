import type { KeyboardEvent } from "react";

// Enter を押しても既定の動作を残す input の type。
// file は Enter でファイル選択ダイアログが開くため。
// submit / button / reset / image は現状どのフォームでも使っていないが、
// 後から入ったときに Enter で押せなくなる事故を防ぐため安全側に倒して除外しておく。
const KEEP_DEFAULT_INPUT_TYPES = new Set([
  "file",
  "submit",
  "button",
  "reset",
  "image",
]);

// 単一行 input で Enter を押すと発生する暗黙の送信（implicit submission）だけを止める。
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
  if (KEEP_DEFAULT_INPUT_TYPES.has(target.type)) {
    return;
  }
  event.preventDefault();
}
