"use client";

import { useEffect } from "react";

// 参照カウント: 複数モーダルが同時に開く場合にロック解除を誤って行わないようにする
let scrollLockCount = 0;

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

  // 4. スクロールバーが存在した場合のみ、消えた分を body の padding-right で補償
  if (hadScrollbar && scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function releaseScrollLock(): void {
  document.documentElement.style.overflow = "";
  document.body.style.paddingRight = "";
}

// モーダル表示中に背景のスクロールを無効化するカスタムフック
// スクロールバーが消えることで画面が左右にズレるのを防ぐため、
// スクロールバーの幅分を body の padding-right で補償する。
// 複数モーダルが同時に開く場合は参照カウントで管理する。
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    scrollLockCount += 1;
    applyScrollLock();

    window.addEventListener("resize", applyScrollLock);

    return () => {
      scrollLockCount -= 1;
      window.removeEventListener("resize", applyScrollLock);

      if (scrollLockCount <= 0) {
        scrollLockCount = 0;
        releaseScrollLock();
      }
    };
  }, [isLocked]);
}
