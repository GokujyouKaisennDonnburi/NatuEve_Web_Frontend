"use client";

import { type RefObject, useEffect, useRef } from "react";

// 送信で入力エラーになったとき、container の中で一番上にあるエラー項目へ移動してフォーカスする。
// エラー項目は FormField などが付ける data-field-error で探す。
// DOM の並び順がそのまま画面の並び順なので、項目の順序を別に持たなくてよい。
// プレビュー表示中の送信では隠れていて移動できないため、表示されてから（hidden が false になってから）移動する。
// 呼び出し側の前提：errors は送信のたびに新しいオブジェクトへ更新し、入力エラーが無ければ空にする。
export function useJumpToFirstError(
  containerRef: RefObject<HTMLElement | null>,
  // 画面ごとのエラーの型をそのまま渡せるよう object で受け取る（空かどうかと参照だけを見る）
  errors: object,
  hidden = false,
) {
  // ジャンプ済みの送信結果。同じ送信のエラーで、表示のたびに何度もジャンプしないようにする。
  const jumpedErrorsRef = useRef<object | null>(null);

  useEffect(() => {
    // errors が更新されるのは送信時だけ。空なら初回マウントか入力エラーなしなので何もしない。
    if (
      hidden ||
      Object.keys(errors).length === 0 ||
      jumpedErrorsRef.current === errors
    ) {
      return;
    }
    jumpedErrorsRef.current = errors;

    const field =
      containerRef.current?.querySelector<HTMLElement>("[data-field-error]");
    if (!field) {
      return;
    }
    const target =
      field.querySelector<HTMLElement>("input, textarea, select") ?? field;
    // focus 単体だと一瞬でジャンプしてしまうため、スクロールを止めてから滑らかに寄せる
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [containerRef, errors, hidden]);
}
