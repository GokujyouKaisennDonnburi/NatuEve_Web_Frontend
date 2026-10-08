"use client";

import { useEffect, type RefObject } from "react";

type UseStickyClipTargets = {
  barRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  // バー下端からさらに下に確保する余白(px)。コンテンツはこの位置より上で
  // 切り取られるため、バーの下にも余白を持たせられる
  bottomMargin?: number;
};

// 粘着表示するバー(コントロール帯)の下端より上に回り込んだコンテンツを
// clip-path で切り取るフック。
// バーは背景を持たず各コントロール本来のデザインを優先するため、
// スクロールで背後に潜ったカードはバーの下端(＋bottomMargin)を基準に非表示にする。
//
// 前提: bar / content はマウント時に存在し、以降は差し替えられないこと。
// (イベント一覧の常時描画要素を想定。遅延マウントされる要素には使えない)
//
// clip-path は視覚的に隠すだけで、切り取られた要素はフォーカス可能なまま残る。
// そこで、切り取りが有効な間は <html> の scroll-padding-top をバー下端に合わせ、
// フォーカス移動(Shift+Tab 等)で隠し領域へスクロールしても
// 対象が帯の下に見える状態を保つ(WCAG 2.4.11 相当)。
// 設定はこのフックの生存期間に限定されるため、他ページのスクロールに影響しない。
// clip-path は position: fixed の子孫も切り取るため、
// モーダル等の fixed 要素を含む要素には適用しないこと。
export function useStickyClip({
  barRef,
  contentRef,
  bottomMargin = 0,
}: Readonly<UseStickyClipTargets>): void {
  useEffect(() => {
    const bar = barRef.current;
    const content = contentRef.current;
    if (!bar || !content) return;

    let lastClip = -1;

    const update = () => {
      const barBottom = bar.getBoundingClientRect().bottom + bottomMargin;
      const contentTop = content.getBoundingClientRect().top;
      const clip = barBottom - contentTop;

      // 値が変わらない書き込みを避けて、不要なスタイル再計算を防ぐ
      if (clip === lastClip) return;
      lastClip = clip;

      if (clip > 0) {
        content.style.clipPath = `inset(${clip}px 0 0 0)`;
        // フォーカス移動時のスクロール位置も、切り取り領域の下端より下に着地させる
        document.documentElement.style.scrollPaddingTop = `${barBottom}px`;
      } else {
        content.style.clipPath = "";
        document.documentElement.style.scrollPaddingTop = "";
      }
    };

    // 読み(getBoundingClientRect)と書き(style への再代入)を1フレームにまとめ、
    // scroll のたびの強制レイアウトを抑える(PageToc の rAF 合流と同じ方針)
    let frameId = 0;
    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        update();
      });
    };

    // スクロール以外(フォント読込・文言折返し等)でもバー高さや
    // コンテンツ位置が変わるため、サイズ変化を監視して追従する
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(bar);
    observer.observe(content);

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameId) cancelAnimationFrame(frameId);
      content.style.clipPath = "";
      document.documentElement.style.scrollPaddingTop = "";
    };
  }, [barRef, contentRef, bottomMargin]);
}
