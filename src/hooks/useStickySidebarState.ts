"use client";

import { useEffect, useState, type RefObject } from "react";

// 絞り込みサイドバーのスクロール状態。
// none:   sticky できない(右カラムがカード以下)。高さ制限も内部スクロールも行わない
// hidden: sticky 可能だが現在は粘着位置にない。高さを維持したまま内部スクロールを隠す
// auto:   粘着位置にあり、内部スクロールを有効にする
export type StickySidebarState = "none" | "hidden" | "auto";

// 対象の sticky 要素の状態を返すフック。
// CSS の max-height を「sticky 後の上端」基準で固定すると、まだ sticky して
// いないスクロールトップ時にかえって要素の下端が画面外へはみ出すため、
// sticky 中だけ内部スクロールを有効にする用途で使う。
//
// sticky 可能かどうかは、親(グリッド)の高さが sticky 要素より高いかで判定する。
// 親が要素以下なら sticky の移動範囲がなく、イベントが少ない場合に
// 「sticky 位置を通過しただけ」で内部スクロールが有効になるのを防ぐ。
//
// sticky 可能だが粘着位置にない間は overflow: hidden にしてスクロールコンテナを
// 維持する。これにより scrollTop を保持したまま、ホイール操作をウィンドウへ伝播できる。
//
// 前提: 対象要素は position: sticky で top が指定されていること。
// sticky でない場合(モバイルの fixed ドロワー等)は常に "none" を返す。
export function useStickySidebarState(
  ref: RefObject<HTMLElement | null>,
): StickySidebarState {
  const [state, setState] = useState<StickySidebarState>("none");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const parent = element.parentElement;
    let lastState: StickySidebarState = "none";
    let frameId = 0;

    const update = () => {
      frameId = 0;

      const style = window.getComputedStyle(element);
      let nextState: StickySidebarState = "none";

      if (style.position === "sticky") {
        const stickyTop = Number.parseFloat(style.top);
        const rect = element.getBoundingClientRect();
        const parentHeight = parent?.getBoundingClientRect().height ?? 0;

        // 親(グリッド)が要素以下なら sticky の移動範囲がない。
        // この場合は高さ制限や内部スクロールを行わず、ページ側をスクロールさせる
        if (Number.isFinite(stickyTop) && parentHeight > rect.height) {
          nextState = rect.top <= stickyTop ? "auto" : "hidden";
        }
      }

      // 値が変わらない時に setState しないことで、スクロール中の再レンダーを抑える
      if (nextState === lastState) return;
      lastState = nextState;
      setState(nextState);
    };

    // 読み(getComputedStyle / getBoundingClientRect)を1フレームにまとめ、
    // scroll のたびの強制レイアウトを抑える(useStickyClip と同じ方針)
    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(update);
    };

    // フォント読込や文言折返し、イベント一覧の高さ変化などで要素の位置や
    // sticky 可能かどうかが変わるため、要素・親・ページ全体のサイズ変化を監視する
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(element);
    if (parent) observer.observe(parent);
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

  return state;
}
