"use client";

import { getMyEventApplication } from "@/services/participate";
import type { MyEventApplicationResponse } from "@/types/participate";
import { useEffect, useState } from "react";

export type UseMyEventApplicationResult = {
  // 取得した申込内容。未取得・申込情報なしの場合は null。
  data: MyEventApplicationResponse | null;
  // ローディング中かどうか。
  isLoading: boolean;
  // エラー情報。エラーがない場合は null。
  error: Error | null;
};

// 自分の申込内容を取得するカスタムフック。
// eventId が変わるごとに再取得し、ローディング・エラー状態を管理する。
//
// 申込内容は参加中のユーザーにしか存在しないため、呼び出し側は参加中と判明してから
// eventId を渡す（未参加・主催者・未ログイン時は null を渡して取得をスキップする）。
// 401（セッション切れ）と 404（未申込・キャンセル済み・匿名申込）は
// 「申込情報なし」として data = null の正常系に倒し、エラー表示にはしない。
export function useMyEventApplication(
  eventId: string | null | undefined,
): UseMyEventApplicationResult {
  const [data, setData] = useState<MyEventApplicationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

    // 再取得の開始時に前回の申込内容を捨てる。
    // eventId が別のイベントへ切り替わったとき、取得が終わるまで前イベントの
    // 申込内容が残っていると、その間に開いたモーダルへ誤った内容を出してしまう。
    setIsLoading(true);
    setData(null);
    setError(null);

    const fetchMyApplication = async (): Promise<void> => {
      try {
        const result = await getMyEventApplication(eventId);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const status =
            err instanceof Error && "status" in err
              ? (err as { status: number }).status
              : null;

          // 401 / 404 は申込内容を出せないだけで、取り消し操作自体は妨げない。
          // エラー表示にすると参加中のユーザーに無用な警告を見せるため正常系に倒す。
          if (status === 401 || status === 404) {
            setData(null);
            setError(null);
          } else {
            setError(
              err instanceof Error
                ? err
                : new Error("申込内容の取得に失敗しました"),
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchMyApplication();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { data, isLoading, error };
}
