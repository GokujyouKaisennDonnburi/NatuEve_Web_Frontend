"use client";

import { useEffect } from "react";

// 参照カウント: 複数モーダルが同時に開く場合にロック解除を誤って行わないようにする
let scrollLockCount = 0;

// 最初のロック適用前のインラインスタイル（最後のロック解除時に復元する）
// 空文字への上書きで既存のインラインスタイルを消さないため
let originalOverflow: string | null = null;
let originalPaddingRight: string | null = null;

// スクロールバー幅のキャッシュ
// html が overflow: visible の環境では window.innerWidth - clientWidth では
// スクロールバー幅を取得できないため、プローブ要素方式で計測してキャッシュする。
let scrollbarWidthCache: number | null = null;

// スクロールバーの幅をプローブ要素方式で取得する
// ルート(html)が overflow: visible の Chromium 環境では
// document.documentElement.clientWidth にスクロールバー分が反映されず
// window.innerWidth - clientWidth が常に 0 になるため、この方式が必要。
function getScrollbarWidth(): number {
  if (scrollbarWidthCache !== null) {
    return scrollbarWidthCache;
  }

  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;top:-9999px;left:0;width:100px;height:100px;overflow:scroll;visibility:hidden;";
  document.body.appendChild(probe);

  const width = probe.offsetWidth - probe.clientWidth;

  probe.remove();

  scrollbarWidthCache = width;

  return width;
}

// 現在ビューポートに垂直スクロールバーが出ているかを判定する
// overflow: hidden を適用する前に呼ぶ必要がある
function hasVerticalScrollbar(): boolean {
  return (
    document.documentElement.scrollHeight >
    document.documentElement.clientHeight
  );
}

// 背景スクロールをロックしつつ、スクロールバー分の余白を維持してレイアウトのズレを防ぐ
function applyScrollLock(): void {
  // 1. スクロールバーが存在するか判定（hidden 適用前）
  const hadScrollbar = hasVerticalScrollbar();

  // 2. スクロールバー幅を取得（キャッシュ済み）
  const scrollbarWidth = getScrollbarWidth();

  // 3. html に overflow:hidden を設定して背景スクロールを禁止
  document.documentElement.style.overflow = "hidden";

  // 4. スクロールバー有無に応じて padding-right を設定/解除する
  //    （リサイズ等でスクロールバーが消えた場合も古い padding が残らないよう両分岐で設定する）
  document.body.style.paddingRight =
    hadScrollbar && scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
}

// モーダル表示中に背景のスクロールを無効化するカスタムフック
// スクロールバーが消えることで画面が左右にズレるのを防ぐため、
// スクロールバーの幅分を body の padding-right で補償する。
// 複数モーダルが同時に開く場合は参照カウントで管理する。
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    scrollLockCount += 1;

    if (scrollLockCount === 1) {
      // 最初のロック時のみ: 元のインラインスタイルを保持してから適用する。
      // resize リスナーも 0→1 の遷移時のみ登録する
      // （同じハンドラは addEventListener で重複登録されないため、
      //   参照カウントで管理しないと途中解除で残りのロックのリスナーまで消える）。
      originalOverflow = document.documentElement.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;
      applyScrollLock();
      window.addEventListener("resize", applyScrollLock);
    }

    return () => {
      scrollLockCount -= 1;

      if (scrollLockCount <= 0) {
        scrollLockCount = 0;
        // 最後のロック解除時のみ: リスナーを解除し、元のインラインスタイルへ復元する
        window.removeEventListener("resize", applyScrollLock);
        document.documentElement.style.overflow = originalOverflow ?? "";
        document.body.style.paddingRight = originalPaddingRight ?? "";
        originalOverflow = null;
        originalPaddingRight = null;
      }
    };
  }, [isLocked]);
}
