"use client";

import { useCallback, useRef, useState } from "react";
import { createTag } from "@/services/tag";
import type { CreateTagResponse } from "@/types/tag";

type UseCreateTagState = {
  // タグ作成中かどうか。連続呼び出しの抑止と UI の disabled に使う。
  isSubmitting: boolean;
  // タグ名を受け取り、API を呼び出してレスポンスを返す。
  // 失敗時は例外を呼び出し側にそのまま伝搬し、UI 側で toast 等に繋ぐ。
  // 通信中に再度呼ばれた場合は進行中の Promise をそのまま返す(重複リクエスト防止)。
  submit: (name: string) => Promise<CreateTagResponse>;
};

// タグ作成 API の呼び出しをラップするフック。
// 内部状態は isSubmitting のみ。エラーは呼び出し側でハンドリングする方針。
// setIsSubmitting は state 更新が非同期のため same-tick の二重呼び出しに
// 間に合わない。inFlightRef で進行中の Promise を保持し、
// 2 回目以降の submit は同じ Promise を返すことで API の重複呼び出しを防ぐ。
export function useCreateTag(): UseCreateTagState {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlightRef = useRef<Promise<CreateTagResponse> | null>(null);

  const submit = useCallback((name: string): Promise<CreateTagResponse> => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }
    const promise = (async () => {
      setIsSubmitting(true);
      try {
        return await createTag({ name });
      } finally {
        inFlightRef.current = null;
        setIsSubmitting(false);
      }
    })();
    inFlightRef.current = promise;
    return promise;
  }, []);

  return { isSubmitting, submit };
}
