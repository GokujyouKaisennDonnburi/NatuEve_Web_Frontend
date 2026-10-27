"use client";

import { useEffect, useState, type RefObject } from "react";

// 対象の sticky 要素が粘着位置に達しているかを返すフック。
// CSS の max-height を「sticky 後の上端」基準で固定すると、まだ sticky して
// いないスクロールトップ時にかえって要素の下端が画面外へはみ出すため、
// 粘着中だけ高さ制限を有効にする用途で使う。
//
// 前提: 対象要素は position: sticky で top が指定されていること。
// sticky でない場合(モバイルの fixed ドロワー等)は常に false を返す。
export function useIsStuck(ref: RefObject<HTMLElement | null>): boolean {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let lastIsStuck = false;
    let frameId = 0;

    const update = () => {
      frameId = 0;

      const style = window.getComputedStyle(element);
      if (style.position !== "sticky") {
        if (!lastIsStuck) return;
        lastIsStuck = false;
        setIsStuck(false);
        return;
      }

      const stickyTop = Number.parseFloat(style.top);
      const nextIsStuck =
        Number.isFinite(stickyTop) &&
        element.getBoundingClientRect().top <= stickyTop;

      // 値が変わらない時に setState しないことで、スクロール中の再レンダーを抑える
      if (nextIsStuck === lastIsStuck) return;
      lastIsStuck = nextIsStuck;
      setIsStuck(nextIsStuck);
    };

    // 読み(getComputedStyle / getBoundingClientRect)を1フレームにまとめ、
    // scroll のたびの強制レイアウトを抑える(useStickyClip と同じ方針)
    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(update);
    };

    // フォント読込や文言折返しなど、スクロール以外でも要素の位置が変わるため、
    // 要素とページ全体のサイズ変化を監視して追従する
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(element);
    observer.observe(document.documentElement);

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [ref]);

  return isStuck;
}
