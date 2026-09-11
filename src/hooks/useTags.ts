"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTags } from "@/services/tag";
import type { TagItem } from "@/types/tag";

type UseTagsState = {
  tags: TagItem[];
  isLoading: boolean;
  error: Error | null;
  // 作成に成功したタグを手元の一覧へ反映する。
  // 一覧はマウント時に一度しか取得しないため、これが無いとセッション中に作成した
  // タグが候補にも重複判定にも現れず、再入力時に 409 を踏むまで気づけない。
  addTag: (tag: TagItem) => void;
  // 一覧を取り直し、最新のタグ配列を返す。
  // 409 duplicate_tag のリカバリなど、その場で最新が必要な箇所から呼ぶ。
  // 取得に失敗した場合は例外をそのまま伝搬する。
  refetch: () => Promise<TagItem[]>;
};

export function useTags(): UseTagsState {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // アンマウント後の setState を避ける。refetch は effect の外からも呼ばれるため、
  // effect ローカルのフラグではなく ref でコンポーネントの寿命を持つ。
  const isMountedRef = useRef(true);
  // 取得の世代。StrictMode の二重マウントや、初回取得と 409 リカバリの再取得が
  // 競合したときに、先に始まって後から返ってきた結果で最新を上書きしないようにする。
  const requestIdRef = useRef(0);
  // addTag で手元に足したタグ。取得の往復中に作成された分はレスポンスに含まれない
  // ことがあり、素直に置き換えると候補から消えてしまうため、取得結果へ混ぜ戻す。
  const locallyAddedRef = useRef<TagItem[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async (): Promise<TagItem[]> => {
    const requestId = ++requestIdRef.current;
    // 自分が最新の取得で、かつまだマウントされているときだけ state を触る。
    const isLatest = () =>
      isMountedRef.current && requestId === requestIdRef.current;

    setIsLoading(true);
    try {
      const response = await getTags();
      // 取得を始めた後に作成したタグはレスポンスに含まれないことがある。落とすと
      // 候補から消え、同名を再入力したときにまた 409 を踏むことになる。
      const fetchedIds = new Set(response.tags.map((tag) => tag.id));
      const missing = locallyAddedRef.current.filter(
        (tag) => !fetchedIds.has(tag.id),
      );
      const merged =
        missing.length > 0 ? [...response.tags, ...missing] : response.tags;

      if (isLatest()) {
        setTags(merged);
        setError(null);
      }
      // 呼び出し側は自分が投げた取得の結果を使うので、世代に関わらず返す。
      return merged;
    } catch (caught) {
      if (isLatest()) {
        // error state は Error 型で持つ。Error 以外が throw されても型と実体が
        // 食い違わないよう包み直す（呼び出し側へは元の値のまま伝える）。
        setError(caught instanceof Error ? caught : new Error(String(caught)));
      }
      throw caught;
    } finally {
      if (isLatest()) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // 初回取得の失敗は error state で表現する。候補が出なくなるだけで入力自体は続けられるため、
    // ここでは握りつぶす（呼び出し側の refetch では例外を伝搬する）。
    void refetch().catch(() => {});
  }, [refetch]);

  const addTag = useCallback((tag: TagItem) => {
    if (!locallyAddedRef.current.some((current) => current.id === tag.id)) {
      locallyAddedRef.current = [...locallyAddedRef.current, tag];
    }
    setTags((prev) =>
      prev.some((current) => current.id === tag.id) ? prev : [...prev, tag],
    );
  }, []);

  return { tags, isLoading, error, addTag, refetch };
}
