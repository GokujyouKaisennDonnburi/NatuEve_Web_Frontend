"use client";

import { useEffect, useState } from "react";

// setTimeout の遅延は 32bit 符号付き整数を超えると即時発火してしまう（約24.8日以上先）。
// これより先の境目にはタイマーを張らず、再訪時の判定に委ねる。
const MAX_TIMEOUT_DELAY = 2_147_483_647;

// 境目ちょうどでは判定が切り替わらないことがあるため、1秒余裕を持たせる。
const BOUNDARY_MARGIN_MS = 1_000;

// 渡した日時のうち次に到来するものを跨いだ時点で、呼び出し元を一度だけ再描画するフック。
//
// 申込期限や終了日時から導く表示（受付終了・開催終了など）は現在時刻に依存するため、
// ページを開いたままだと期限を過ぎても古い表示のまま残ってしまう。
// 常時ポーリングはせず、次の境目にだけタイマーを張る。跨いだあとは、さらに次の境目へ
// 張り直すため、申込期限 → 終了日時のように複数段の切り替わりにも追随する。
//
// 日時として読めない値・未設定の値は境目として扱わない。
// 未来の境目が1つもない場合はタイマーを張らないため、期限のないイベントでは何もしない。
export function useDeadlineRefresh(
  deadlines: readonly (string | null | undefined)[],
): void {
  const [now, setNow] = useState(() => Date.now());

  // 依存配列の要素数を固定するため、日時の並びを1つの文字列にまとめる。
  // 配列をそのまま展開すると、要素数が変わったときに useEffect が壊れる。
  // RFC3339 の日時に "|" は現れないため、区切り文字として使える。
  const deadlineKey = deadlines.join("|");

  useEffect(() => {
    const nextBoundary = deadlineKey
      .split("|")
      .map((value) => (value ? Date.parse(value) : Number.NaN))
      .filter((time) => Number.isFinite(time) && time > now)
      .sort((a, b) => a - b)[0];

    if (nextBoundary === undefined) return;

    const delay = nextBoundary - now + BOUNDARY_MARGIN_MS;

    if (delay > MAX_TIMEOUT_DELAY) return;

    const timer = setTimeout(() => setNow(Date.now()), delay);

    return () => clearTimeout(timer);
  }, [now, deadlineKey]);
}
