"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { EVENT_POST_PREVIEW_SCROLL_MAPPING } from "@/components/organisms/event-post/eventPostPreviewScroll";
import {
  captureScrollSyncPoint,
  type ScrollSyncPoint,
  scrollToSyncPoint,
} from "@/utils/scrollSync";

export type EventPostMode = "edit" | "preview";

// イベント投稿画面の入力/プレビュー切替と、切替前後の表示位置をまとめて扱うフック。
// - 入力→プレビュー：入力で見ていた項目に対応する所をプレビューで表示する
// - プレビュー→入力：プレビューへ切り替える前の入力の位置へ戻す
// 入力フォームはプレビュー中も外さずに隠して保持すること（高さが変わらない前提で位置を戻すため）。
export function useEventPostMode() {
  const [mode, setMode] = useState<EventPostMode>("edit");
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
  const changeMode = (nextMode: EventPostMode) => {
    const focusedElement = focusedBeforeSwitchRef.current;
    focusedBeforeSwitchRef.current = null;
    if (mode === "edit" && nextMode === "preview") {
      editScrollYRef.current = window.scrollY;
      scrollSyncPointRef.current = captureScrollSyncPoint(
        EVENT_POST_PREVIEW_SCROLL_MAPPING,
        focusedElement,
      );
    }
    setMode(nextMode);
  };

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
    // 切替部品のラッパーに付ける。切替の操作でフォーカスが移る前に、フォーカス中の要素を記録する
    switchCaptureHandlers: {
      onPointerDownCapture: rememberFocusBeforeSwitch,
      onKeyDownCapture: rememberFocusBeforeSwitch,
    },
  };
}
