"use client";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { getEventDetail } from "@/services/event";
import { confirmEventJoin } from "@/services/participate";
import {
  ConfirmJoinError,
  ConfirmJoinErrorCode,
  type ConfirmJoinResponse,
} from "@/types/participate";
import { useCallback, useEffect, useRef, useState } from "react";

// 申込確認画面の状態。
// idle: 確定前 / submitting: 確定中 / success: 確定済み / error: 確定失敗。
export type EventJoinConfirmStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

// 確認画面に表示するエラーメッセージを API のエラー種別ごとに決める。
export function resolveConfirmJoinErrorMessage(error: unknown): string {
  if (error instanceof ConfirmJoinError) {
    switch (error.code) {
      case ConfirmJoinErrorCode.InvalidRequest:
        return "この確認リンクは無効か、有効期限が切れています。お手数ですが、イベントページからもう一度お申し込みください。";
      case ConfirmJoinErrorCode.NotFound:
        return "イベントが見つかりませんでした。";
      case ConfirmJoinErrorCode.CapacityFull:
        return "定員に達しているため、申込を確定できませんでした。";
      case ConfirmJoinErrorCode.EventEnded:
        return "イベントは終了しているため、申込を確定できませんでした。";
      case ConfirmJoinErrorCode.EventCancelled:
        return "イベントは取りやめになったため、申込を確定できませんでした。";
      case ConfirmJoinErrorCode.RateLimited:
        return "アクセスが集中しています。時間をおいて再度お試しください。";
      default:
        return (
          error.message ||
          "申込を確定できませんでした。時間をおいて再度お試しください。"
        );
    }
  }

  return "申込を確定できませんでした。時間をおいて再度お試しください。";
}

// 確定を再試行できるエラーかどうか。
// トークンは単回使用のため、無効・期限切れ・使用済みやイベント終了・取りやめ済みでは
// 再試行しても成功しない。時間をおけば成功しうるエラーのみ再試行を許可する。
export function isRetryableConfirmJoinError(error: unknown): boolean {
  if (!(error instanceof ConfirmJoinError)) {
    // 通信エラーなどは同じトークンで再試行できる。
    return true;
  }

  switch (error.code) {
    case ConfirmJoinErrorCode.CapacityFull:
    case ConfirmJoinErrorCode.RateLimited:
    case ConfirmJoinErrorCode.InternalError:
      return true;
    default:
      return false;
  }
}

type UseEventJoinConfirmParams = {
  eventId: string;
  // URL の ?token= から取得した確認トークン。空の場合は確定できない。
  token: string;
};

// 申込確認画面の確定処理を管理するフック。
//
// トークンが無い場合は API を呼ばずにエラー状態から始める。
// 確定はボタン操作で1回だけ実行し、二重送信は ref で防ぐ
// （トークンは単回使用のため、2回目は必ず失敗してしまう）。
export function useEventJoinConfirm({
  eventId,
  token,
}: UseEventJoinConfirmParams) {
  const [status, setStatus] = useState<EventJoinConfirmStatus>(
    token ? "idle" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token
      ? null
      : "確認リンクが正しくありません。メールに記載のリンクを開き直してください。",
  );
  // 確定できた申込の内容。成功画面でカテゴリ別の人数を表示するために保持する。
  const [result, setResult] = useState<ConfirmJoinResponse | null>(null);
  // 確定失敗時に再試行ボタンを表示するかどうか。
  // トークン消費後は再試行できないため、確定前・確定成功時は常に false。
  const [canRetry, setCanRetry] = useState(false);
  // 確定前に何のイベントへ申し込むのかを確認できるよう、イベント情報を取得する。
  // 取得に失敗しても確定操作自体は妨げないため、エラー表示にはしない。
  const [event, setEvent] = useState<EventDetailType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchEvent = async (): Promise<void> => {
      try {
        const detail = await getEventDetail(eventId);
        if (!cancelled) {
          setEvent(detail);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("イベント情報の取得に失敗しました", error);
        }
      }
    };

    void fetchEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // 連打・二重実行を防ぐための実行中フラグ。
  // state は再描画まで反映されないため、同期的に判定できる ref を使う。
  const isSubmittingRef = useRef(false);

  const confirm = useCallback(() => {
    if (!token || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setStatus("submitting");
    setErrorMessage(null);

    void (async () => {
      let succeeded = false;

      try {
        const response = await confirmEventJoin(eventId, token);
        setResult(response);
        setStatus("success");
        succeeded = true;
      } catch (error) {
        setErrorMessage(resolveConfirmJoinErrorMessage(error));
        setCanRetry(isRetryableConfirmJoinError(error));
        setStatus("error");
      } finally {
        // 成功時はトークン消費済みとして扱い、以降の confirm 呼び出しを無効化する。
        if (!succeeded) {
          isSubmittingRef.current = false;
        }
      }
    })();
  }, [eventId, token]);

  return {
    status,
    errorMessage,
    // 確定成功時のみ申込内容が入る。
    result,
    // 申込先のイベント概要。取得できていない間は null。
    event,
    // 確定前・失敗後のみ押せる。確定中と確定済みは何もしない。
    confirm,
    // 再試行が意味のあるエラーで確定に失敗した場合のみ true。
    canRetry,
  };
}
