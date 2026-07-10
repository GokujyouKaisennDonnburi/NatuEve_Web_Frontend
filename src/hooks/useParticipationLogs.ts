"use client";

import { getParticipationLogs } from "@/services/participate";
import type { ParticipationLogsResponse } from "@/types/participate";
import { useCallback, useEffect, useState } from "react";

export type UseParticipationLogsResult = {
  // 取得した参加状態。未取得時は null。
  data: ParticipationLogsResponse | null;
  // ローディング中かどうか。
  isLoading: boolean;
  // エラー情報。エラーがない場合は null。
  error: Error | null;
  // 参加状態を再取得する。参加申し込み / キャンセル後に呼んで最新状態へ切り替える。
  refetch: () => void;
};

// イベント参加状態取得フック。
// eventId が変わるごとに再取得し、ローディング・エラー状態を管理する。
// 認証済み（enabled = true）の場合のみ API を呼び、未認証時は取得をスキップする。
// 401 は「未参加」と同等に扱い（participating: false）、エラー状態にはしない。
export function useParticipationLogs(
  eventId: string | null | undefined,
  enabled: boolean,
): UseParticipationLogsResult {
  const [data, setData] = useState<ParticipationLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // refetch をトリガーするためのカウンター
  const [refetchCount, setRefetchCount] = useState(0);

  const refetch = useCallback(() => {
    setRefetchCount((prev) => prev + 1);
  }, []);

  // refetchCount は refetch トリガーとしてのみ使用する（effect 内では参照しない）。
  // biome-ignore lint/correctness/useExhaustiveDependencies: refetchCount is an intentional refetch trigger, not a direct dependency.
  useEffect(() => {
    // eventId が無効、または未認証の場合は取得を行わない
    if (!eventId || !enabled) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // キャンセルフラグを設定して、コンポーネントがアンマウントされた場合に状態更新を防ぐ
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const fetchParticipationLogs = async (): Promise<void> => {
      try {
        const result = await getParticipationLogs(eventId);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          // 401 は「未ログイン・未参加」として正常系扱いにする。
          // 認証済みでトークンが無効・期限切れの場合はエラー表示するとUXを損ねるため、
          // 参加していない（participating: false）として扱う。
          if (
            err instanceof Error &&
            "status" in err &&
            (err as { status: number }).status === 401
          ) {
            setData({ participating: false });
            setError(null);
          } else {
            setError(
              err instanceof Error
                ? err
                : new Error("参加状態の取得に失敗しました"),
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchParticipationLogs();
    return () => {
      cancelled = true;
    };
  }, [eventId, enabled, refetchCount]);

  return { data, isLoading, error, refetch };
}
