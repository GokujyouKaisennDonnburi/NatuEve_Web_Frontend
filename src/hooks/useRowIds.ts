import { useEffect, useState } from "react";

// 行ごとに安定したIDを管理するフック。配列のインデックスをそのまま key に使うと、
// 行の追加・削除によって後続の行のインデックスがずれてしまい、DOM が再マウントされてしまう
// （入力中のフォーカスが外れる等）。そのため、行ごとに UUID を割り当て、
// 追加・削除が起きても各行が同じ ID を保ち続けるようにする。
export function useRowIds(length: number) {
  // 各行のIDを管理する状態。行の追加や削除に対応するため、length に応じて動的に更新される。
  const [rowIds, setRowIds] = useState<string[]>(() =>
    Array.from({ length }, () => crypto.randomUUID()),
  );

  // length が変わったときに rowIds を更新するエフェクト。行の追加や削除に対応するため、length に応じて rowIds を動的に更新する。
  useEffect(() => {
    // length に応じて rowIds を更新する。
    setRowIds((current) => {
      // length と現在の rowIds の長さが同じ場合はそのまま返す。
      if (current.length === length) {
        return current;
      }

      // length より rowIds の長さが短い場合は、足りない分のIDを生成して追加する。length より rowIds の長さが長い場合は、余分なIDを削除する。
      if (current.length < length) {
        return [
          ...current,
          ...Array.from({ length: length - current.length }, () =>
            crypto.randomUUID(),
          ),
        ];
      }

      return current.slice(0, length);
    });
  }, [length]);

  // 行を追加する処理。rowIds に新しいIDを追加する。
  const addRowId = () => {
    setRowIds((current) => [...current, crypto.randomUUID()]);
  };

  // 行を削除する処理。rowIds から該当するIDを削除する。
  const removeRowId = (index: number) => {
    setRowIds((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  return { rowIds, addRowId, removeRowId };
}
