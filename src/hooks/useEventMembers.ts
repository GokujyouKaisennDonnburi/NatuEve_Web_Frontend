"use client";

import { getEventMembers } from "@/services/participate";
import type { EventMembersResponse } from "@/types/participate";
import { useEffect, useState } from "react";

export type UseEventMembersResult = {
  // 取得した参加者一覧。未取得時は null。
  data: EventMembersResponse | null;
  // ローディング中かどうか。
  isLoading: boolean;
  // エラー情報。エラーがない場合は null。
  error: Error | null;
};

// イベント参加者一覧を取得するカスタムフック。
// eventId が変わるごとに再取得し、ローディング・エラー状態を管理する。
// 主催者以外は API が 403 を返すため、呼び出し側は主催者判定後のみマウントすることを想定。
export function useEventMembers(
  eventId: string | null | undefined,
): UseEventMembersResult {
  const [data, setData] = useState<EventMembersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // eventId が無効な場合は取得を行わず空状態にする
    if (!eventId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // キャンセルフラグを設定して、コンポーネントがアンマウントされた場合に状態更新を防ぐ
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const fetchMembers = async (): Promise<void> => {
      try {
        const result = await getEventMembers(eventId);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err
              : new Error("参加者一覧の取得に失敗しました"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchMembers();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { data, isLoading, error };
}
