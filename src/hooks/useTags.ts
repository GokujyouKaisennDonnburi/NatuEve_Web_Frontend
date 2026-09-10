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
      if (isLatest()) {
        setTags(response.tags);
        setError(null);
      }
      // 呼び出し側は自分が投げた取得の結果を使うので、世代に関わらず返す。
      return response.tags;
    } catch (caught) {
      if (isLatest()) {
        setError(caught as Error);
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
    setTags((prev) =>
      prev.some((current) => current.id === tag.id) ? prev : [...prev, tag],
    );
  }, []);

  return { tags, isLoading, error, addTag, refetch };
}
