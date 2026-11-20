"use client";

import { useCallback, useState } from "react";

import { createContact } from "@/services/contact";
import type {
  CreateContactRequest,
  CreateContactResponse,
} from "@/types/contact";

type CreateContactResult =
  | { ok: true; response: CreateContactResponse }
  | { ok: false; error: unknown };

type UseCreateContactState = {
  // 送信中かどうか。ボタンの二重クリック防止（disabled）に使う。
  isSubmitting: boolean;
  // 送信 payload を受け取り、API を呼び出して結果を返す。
  // 成功・失敗の表示（トースト・遷移）は UI 側の責務として、
  // 例外は握りつぶさず結果の error に入れて返す。
  submit: (payload: CreateContactRequest) => Promise<CreateContactResult>;
};

// お問い合わせ送信 Service の呼び出しと送信中状態を管理するフック。
// 内部状態は isSubmitting のみ。表示は呼び出し側でハンドリングする方針。
export function useCreateContact(): UseCreateContactState {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (payload: CreateContactRequest): Promise<CreateContactResult> => {
      setIsSubmitting(true);
      try {
        const response = await createContact(payload);
        return { ok: true, response };
      } catch (error) {
        return { ok: false, error };
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { isSubmitting, submit };
}
