"use client";

import { useCallback, useRef, useState } from "react";
import { createTag } from "@/services/tag";
import type { CreateTagResponse } from "@/types/tag";

type UseCreateTagState = {
  // タグ作成中かどうか。連続呼び出しの抑止と UI の disabled に使う。
  isSubmitting: boolean;
  // タグ名を受け取り、API を呼び出してレスポンスを返す。
  // 失敗時は例外を呼び出し側にそのまま伝搬し、UI 側で toast 等に繋ぐ。
  // 同じ名前で通信中に再度呼ばれた場合は進行中の Promise をそのまま返す(重複リクエスト防止)。
  submit: (name: string) => Promise<CreateTagResponse>;
};

// タグ作成 API の呼び出しをラップするフック。
// 内部状態は isSubmitting のみ。エラーは呼び出し側でハンドリングする方針。
// setIsSubmitting は state 更新が非同期のため same-tick の二重呼び出しに
// 間に合わない。進行中の Promise をタグ名ごとに保持し、同名の 2 回目以降の
// submit は同じ Promise を返すことで API の重複呼び出しを防ぐ。
// タグ名で引き分けるのは、名前を見ずに使い回すと別タグの追加が進行中のときに
// 違うタグの id / name を返してしまうため。
export function useCreateTag(): UseCreateTagState {
  const [pendingCount, setPendingCount] = useState(0);
  const inFlightRef = useRef(new Map<string, Promise<CreateTagResponse>>());

  const submit = useCallback((name: string): Promise<CreateTagResponse> => {
    const inFlight = inFlightRef.current.get(name);
    if (inFlight) {
      return inFlight;
    }
    const promise = (async () => {
      setPendingCount((count) => count + 1);
      try {
        return await createTag({ name });
      } finally {
        // 自分の名前の分だけ落とす。進行中の別リクエストには触れない。
        inFlightRef.current.delete(name);
        setPendingCount((count) => count - 1);
      }
    })();
    inFlightRef.current.set(name, promise);
    return promise;
  }, []);

  return { isSubmitting: pendingCount > 0, submit };
}
