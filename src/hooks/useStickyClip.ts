"use client";

import { useEffect, type RefObject } from "react";

type UseStickyClipTargets = {
  barRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
};

// 粘着表示するバー(コントロール帯)の下端より上に回り込んだコンテンツを
// clip-path で切り取るフック。
// バーは背景を持たず各コントロール本来のデザインを優先するため、
// スクロールで背後に潜ったカードはバーの下端を基準に非表示にする。
// バーの粘着位置はスクロール量に依存するため、scroll ごとに再計算する。
// clip-path は position: fixed の子孫も切り取るため、
// モーダル等の fixed 要素を含む要素には適用しないこと。
export function useStickyClip({
  barRef,
  contentRef,
}: Readonly<UseStickyClipTargets>): void {
  useEffect(() => {
    const bar = barRef.current;
    const content = contentRef.current;
    if (!bar || !content) return;

    const update = () => {
      const barBottom = bar.getBoundingClientRect().bottom;
      const contentTop = content.getBoundingClientRect().top;
      const clip = barBottom - contentTop;

      if (clip > 0) {
        content.style.clipPath = `inset(${clip}px 0 0 0)`;
      } else {
        content.style.clipPath = "";
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      content.style.clipPath = "";
    };
  }, [barRef, contentRef]);
}
