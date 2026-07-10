"use client";

import { useCallback, useState } from "react";
import { createTag } from "@/services/tag";
import type { CreateTagResponse } from "@/types/tag";

type UseCreateTagState = {
  // タグ作成中かどうか。連続呼び出しの抑止と UI の disabled に使う。
  isSubmitting: boolean;
  // タグ名を受け取り、API を呼び出してレスポンスを返す。
  // 失敗時は例外を呼び出し側にそのまま伝搬し、UI 側で toast 等に繋ぐ。
  submit: (name: string) => Promise<CreateTagResponse>;
};

// タグ作成 API の呼び出しをラップするフック。
// 内部状態は isSubmitting のみ。エラーは呼び出し側でハンドリングする方針。
export function useCreateTag(): UseCreateTagState {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async (name: string) => {
    setIsSubmitting(true);
    try {
      return await createTag({ name });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, submit };
}
