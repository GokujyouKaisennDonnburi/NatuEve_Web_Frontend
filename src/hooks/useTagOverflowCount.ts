"use client";

import type { TagItem } from "@/types/tag";
import { calcVisibleTagCount } from "@/utils/tagOverflow";
import { useLayoutEffect, useRef, useState } from "react";

type UseTagOverflowCountOptions = {
  // タグを横並びにして個数調整する場合のみ true。無効の間は全件表示を表す null を返す
  enabled: boolean;
  // タグ同士・タグとチップの間隔(px)
  gapPx: number;
};

// 固定幅のタグを横並びにしたとき、表示範囲に入りきる個数だけを描画するためのフック(#467)。
// 収まりきらなかったタグは「+N」チップにまとめるため、
// rowRef をタグ領域、chipRef をチップのラッパー要素に設定して使う。
// visibleCount は null が全件表示(計測前・無効・全件収まる)を表す。
export function useTagOverflowCount(
  tags: TagItem[],
  { enabled, gapPx }: UseTagOverflowCountOptions,
) {
  // タグ構成の変化(同一 id でのリネーム含む)を検知するため、id と名前の両方を署名にする
  const tagSignature = tags.map((tag) => `${tag.id}:${tag.name}`).join(",");
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const lastTagSignatureRef = useRef(tagSignature);
  const tagWidthsRef = useRef<number[]>([]);
  const chipWidthRef = useRef(0);

  // useLayoutEffect で描画前に個数を確定させ、計測前の全件表示が描画されるのを防ぐ
  useLayoutEffect(() => {
    // 無効になったら全件表示に戻す。再び有効になったときは
    // キャッシュ済みの実測幅から個数を数え直す
    if (!enabled) {
      setVisibleCount(null);
      return;
    }
    const el = rowRef.current;
    if (!el || tags.length === 0) {
      return;
    }

    // タグ構成が変わったら実測幅を破棄し、全件表示から測り直す
    if (lastTagSignatureRef.current !== tagSignature) {
      lastTagSignatureRef.current = tagSignature;
      tagWidthsRef.current = [];
      if (visibleCount !== null) {
        setVisibleCount(null);
        return;
      }
    }

    const update = () => {
      // あふれたタグは描画していないため、各タグの幅は全件表示のときしか実測できない
      if (tagWidthsRef.current.length === 0) {
        if (visibleCount !== null) {
          return;
        }
        tagWidthsRef.current = Array.from(
          el.children,
          (child) => child.getBoundingClientRect().width,
        );
      }
      if (chipRef.current) {
        chipWidthRef.current = chipRef.current.getBoundingClientRect().width;
      }

      const next = calcVisibleTagCount({
        tagWidths: tagWidthsRef.current,
        containerWidth: el.getBoundingClientRect().width,
        gap: gapPx,
        chipWidth: chipWidthRef.current,
      });
      const nextVisibleCount = next === tags.length ? null : next;
      if (nextVisibleCount !== visibleCount) {
        setVisibleCount(nextVisibleCount);
      }
    };

    update();

    // 表示幅はビューポートの変更(リサイズ・回転)で変わるため、変化のたびに数え直す
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, visibleCount, tagSignature, tags.length, gapPx]);

  return { visibleCount, rowRef, chipRef };
}
