"use client";

import { useLayoutEffect, useRef, useState } from "react";

import {
  captureScrollSyncPoint,
  type ScrollSyncMapping,
  type ScrollSyncPoint,
  scrollToSyncPoint,
} from "@/utils/scrollSync";

export type EditPreviewMode = "edit" | "preview";

// 投稿画面の入力/プレビュー切替と、切替前後の表示位置をまとめて扱うフック。
// - 入力→プレビュー：入力で見ていた項目に対応する所（mapping の対応表）をプレビューで表示する
// - プレビュー→入力：プレビューへ切り替える前の入力の位置へ戻す
// - プレビュー表示中の送信で入力エラーになったら、入力へ切り替える
// 呼び出し側の前提：
// - 入力フォームはプレビュー中も外さずに隠して保持する（高さが変わらない前提で位置を戻すため）
// - errors は送信のたびに新しいオブジェクトへ更新し、入力エラーが無ければ空にする
export function useEditPreviewMode(
  mapping: ScrollSyncMapping,
  errors: Readonly<Record<string, unknown>>,
) {
  const [mode, setMode] = useState<EditPreviewMode>("edit");
  // 入力→プレビュー切替時に、入力で見ていた位置を切替後の位置合わせまで持ち越す
  const scrollSyncPointRef = useRef<ScrollSyncPoint | null>(null);
  // 入力→プレビュー切替時の入力の scrollY。プレビューから戻ったときに同じ位置へ戻す
  const editScrollYRef = useRef<number | null>(null);
  // 切替を操作した瞬間にフォーカスしていた要素。切替の操作でフォーカスが切替側へ
  // 移ってしまうため、移る前に記録して「入力中の項目」の判定に使う。
  // キーボードで切り替えるときは切替のラジオ自身が記録され、画面上部の帯による判定になる。
  // 切替が起きなかった操作（選択中の側を押した等）の記録は次の操作で上書きされるまで残るが、
  // 使う時点で画面に見えているかを判定し直すため、古い要素で位置が大きく外れることはない。
  const focusedBeforeSwitchRef = useRef<Element | null>(null);
  const rememberFocusBeforeSwitch = () => {
    focusedBeforeSwitchRef.current = document.activeElement;
  };

  // どちらの方向で使う位置も入力画面でしか測れないため、入力→プレビューの切替前にまとめて記録する。
  const changeMode = (nextMode: EditPreviewMode) => {
    const focusedElement = focusedBeforeSwitchRef.current;
    focusedBeforeSwitchRef.current = null;
    if (mode === "edit" && nextMode === "preview") {
      editScrollYRef.current = window.scrollY;
      scrollSyncPointRef.current = captureScrollSyncPoint(
        mapping,
        focusedElement,
      );
    }
    setMode(nextMode);
  };

  // プレビュー表示中の送信で入力エラーになったら、入力へ切り替えてエラー項目を見せる。
  // errors が更新されるのは送信時だけなので、空でなければ今回の送信が入力エラーだったことになる。
  // エラー項目へのジャンプは、表示された入力フォーム側（useJumpToFirstError）で行う。
  // プレビューが一瞬描画されてから切り替わらないよう、描画前に切り替える。
  useLayoutEffect(() => {
    if (Object.keys(errors).length > 0) {
      setMode("edit");
    }
  }, [errors]);

  // 切替後の描画直後、画面に表示される前に位置を合わせ、切替時のちらつきを防ぐ
  useLayoutEffect(() => {
    if (mode === "preview") {
      const point = scrollSyncPointRef.current;
      scrollSyncPointRef.current = null;
      // 見ている項目が無かった（ページ先頭付近など）ときは位置を合わせず、切替前の scrollY のままにする
      if (point) {
        scrollToSyncPoint(point);
      }
      return;
    }

    // 入力フォームはプレビュー中も隠して保持しており高さが変わらないため、
    // 同じ scrollY に戻せば切替前と同じ表示になる。
    // （送信の入力エラーで戻るときはエラー文言の分だけ高さが変わるが、
    // この後に入力フォーム側がエラー項目へジャンプするので問題ない）
    // html の scroll-behavior: smooth を打ち消し、切替と同時に表示位置を戻す。
    const scrollY = editScrollYRef.current;
    editScrollYRef.current = null;
    if (scrollY !== null) {
      window.scrollTo({ top: scrollY, behavior: "instant" });
    }
  }, [mode]);

  return {
    mode,
    changeMode,
    // 切替部品（EditPreviewSwitch）に渡す。切替の操作でフォーカスが移る前に、フォーカス中の要素を記録する
    switchCaptureHandlers: {
      onPointerDownCapture: rememberFocusBeforeSwitch,
      onKeyDownCapture: rememberFocusBeforeSwitch,
    },
  };
}
