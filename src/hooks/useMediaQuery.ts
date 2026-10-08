"use client";

import { useCallback, useSyncExternalStore } from "react";

// サーバー描画とハイドレーション中に返す値
const getServerSnapshot = () => false;

// matchMedia のマッチ状態を購読する共通フック。change イベントで追従する。
// サーバー描画とハイドレーション中は window を参照できないため false を返し、
// ハイドレーション後に実際の値で描画し直す。
// クライアントで新しく表示されるとき（画面遷移・入力/プレビュー切替など）は、最初の描画から実際の値を返す。
// effect で後から値を入れると最初の描画が false のレイアウトになり、表示直後に高さが変わって
// 切替時の位置合わせなどがずれるため。
export function useMediaQuery(query: string): boolean {
  // subscribe と getSnapshot は query が変わらない限り同じ関数にする。
  // 描画のたびに別の関数になると、React が購読や値の確認を描画ごとにやり直すため。
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => {
        mediaQueryList.removeEventListener("change", onChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
