"use client";

import { useAuthContext } from "@/components/layouts/AuthProvider";
import { MOCK_AUTH_SESSION, isMockAuthEnabled } from "@/services/mockAuth";
import { participateEvent } from "@/services/participate";
import type { EventDetailCost } from "@/types/event";
import type { ParticipantEntry } from "@/types/participate";
import { ParticipateError, ParticipateErrorCode } from "@/types/participate";
import type {
  ParticipantCounts,
  ParticipationSummary,
} from "@/utils/participation";
import {
  buildParticipationSummary,
  createInitialCounts,
  resolveParticipationCosts,
} from "@/utils/participation";
import { normalizeHalfWidthDigits } from "@/utils/format";
import { isEmail } from "@/utils/validation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// 申し込みモーダルのステップ。
export const ParticipationStepId = {
  // 未登録者のみ通る、お名前とメールアドレスの入力ステップ。
  GuestInfo: "guest-info",
  // カテゴリごとの参加人数を選ぶステップ。
  Count: "count",
  // 申し込み完了の表示ステップ。
  Complete: "complete",
} as const;

export type ParticipationStepId =
  (typeof ParticipationStepId)[keyof typeof ParticipationStepId];

// ステッパーに表示するステップ名。
export const PARTICIPATION_STEP_LABELS: Record<ParticipationStepId, string> = {
  [ParticipationStepId.GuestInfo]: "お客様情報",
  [ParticipationStepId.Count]: "人数",
  [ParticipationStepId.Complete]: "完了",
};

// お客様情報ステップの入力エラー。API の DTO と揃えたキー名にする。
export type ParticipationFieldErrors = {
  username?: string;
  mailAddress?: string;
};

type UseParticipationFormParams = {
  eventId: string;
  // イベントの参加費用カテゴリ。空の場合は無料の単一カテゴリとして扱う。
  costs: EventDetailCost[] | undefined;
  // 申し込める上限人数。1 未満のときは上限なしとして扱う。
  //
  // 本来は「残り枠」を使いたいが、参加者数を返す API は主催者専用のため、
  // 一般の参加者はイベントの定員をそのまま上限として扱う。
  capacity: number | undefined;
  // 申し込み成功後に呼ばれる。参加状態の再取得に使う。
  onSuccess?: () => void;
};

// 参加申し込みのエラーを種別ごとにトーストへ振り分ける。
const notifyParticipateError = (error: unknown) => {
  if (error instanceof ParticipateError) {
    switch (error.code) {
      case ParticipateErrorCode.AlreadyJoined:
        toast.error(error.message || "既に参加しています。");
        return;
      case ParticipateErrorCode.CapacityFull:
        toast.error(error.message || "定員に達しています。");
        return;
      case ParticipateErrorCode.RequestTooLarge:
        toast.error(error.message || "参加人数が多すぎます。");
        return;
      case ParticipateErrorCode.RateLimited:
        toast.error(
          error.message ||
            "アクセスが集中しています。時間をおいて再度お試しください。",
        );
        return;
      case ParticipateErrorCode.Unauthorized:
        toast.error(error.message || "認証が必要です。");
        return;
      case ParticipateErrorCode.NotFound:
        toast.error(error.message || "イベントが見つかりません。");
        return;
      case ParticipateErrorCode.InvalidRequest:
        toast.error(error.message || "入力内容に不備があります。");
        return;
      default:
        toast.error(error.message);
        return;
    }
  }

  console.error("参加申し込みに失敗しました。", error);
  toast.error("参加申し込みに失敗しました。時間をおいて再度お試しください。");
};

// 参加申し込みモーダルの状態を管理するフック。
//
// ステップ遷移・人数選択・お客様情報の入力とバリデーション、
// および参加申し込み API の送信までを担当する。
// 表示は呼び出し側のコンポーネントに委ね、ここでは UI を持たない。
export function useParticipationForm({
  eventId,
  costs,
  capacity,
  onSuccess,
}: UseParticipationFormParams) {
  // 申し込みに必要なのはセッションの email / name / トークンだけなので、
  // プロフィール取得を待たない isSessionLoading で判定する。
  const { session, isSessionLoading } = useAuthContext();
  const isAuthenticated = Boolean(session?.token);

  // 参加費用が未設定でも人数だけは選べるようにフォールバックを挟む。
  const resolvedCosts = useMemo(
    () => resolveParticipationCosts(costs),
    [costs],
  );

  // ログイン済みなら「お客様情報」を飛ばして人数選択から始める。
  const steps = useMemo<ParticipationStepId[]>(
    () =>
      isAuthenticated
        ? [ParticipationStepId.Count, ParticipationStepId.Complete]
        : [
            ParticipationStepId.GuestInfo,
            ParticipationStepId.Count,
            ParticipationStepId.Complete,
          ],
    [isAuthenticated],
  );

  const [currentStep, setCurrentStep] = useState<ParticipationStepId>(steps[0]);

  // セッションの確定・失効でフローが切り替わると、保持中のステップが
  // 現在のフローに存在しなくなることがある。その場合は先頭ステップへ倒す。
  const step = steps.includes(currentStep) ? currentStep : steps[0];
  const [counts, setCounts] = useState<ParticipantCounts>(() =>
    createInitialCounts(resolvedCosts),
  );
  const [username, setUsername] = useState("");
  const [mailAddress, setMailAddress] = useState("");
  // 入力前からエラーを出さないよう、一度触れた項目だけメッセージを表示する。
  const [touched, setTouched] = useState({
    username: false,
    mailAddress: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 定員が未設定・0以下のイベントは上限なしとして扱う。
  const maxCount =
    typeof capacity === "number" && capacity >= 1 ? Math.floor(capacity) : null;

  const summary = useMemo<ParticipationSummary>(
    () => buildParticipationSummary(resolvedCosts, counts),
    [resolvedCosts, counts],
  );

  // 上限に達しているか。達している間は増やす操作を止める。
  const isAtCapacity = maxCount !== null && summary.totalCount >= maxCount;

  // 入力値の検証。信頼の境界は API 側なので、ここでは UX 補助に留める。
  const validationErrors = useMemo<ParticipationFieldErrors>(() => {
    const errors: ParticipationFieldErrors = {};

    if (!username.trim()) {
      errors.username = "お名前を入力してください";
    }

    const trimmedMailAddress = mailAddress.trim();

    if (!trimmedMailAddress) {
      errors.mailAddress = "メールアドレスを入力してください";
    } else if (!isEmail(trimmedMailAddress)) {
      errors.mailAddress = "メールアドレスの形式が正しくありません";
    }

    return errors;
  }, [username, mailAddress]);

  // 表示するエラー。触れていない項目は伏せる。
  const errors = useMemo<ParticipationFieldErrors>(
    () => ({
      username: touched.username ? validationErrors.username : undefined,
      mailAddress: touched.mailAddress
        ? validationErrors.mailAddress
        : undefined,
    }),
    [touched, validationErrors],
  );

  // 人数選択へ進めるか。ログイン済みの場合はお客様情報ステップ自体が無い。
  const canGoNext =
    isAuthenticated ||
    (!validationErrors.username && !validationErrors.mailAddress);

  // お客様情報へ戻れるか。ログイン済みの場合はそのステップ自体が無い。
  const canGoBack = !isAuthenticated && step === ParticipationStepId.Count;

  // 申し込みを確定できるか。0名では送信させない。
  const canSubmit =
    !isSubmitting && !isSessionLoading && summary.totalCount >= 1 && canGoNext;

  const canIncrement = useCallback(
    () => !isSubmitting && !isAtCapacity,
    [isSubmitting, isAtCapacity],
  );

  const canDecrement = useCallback(
    (index: number) => !isSubmitting && (counts[index] ?? 0) > 0,
    [isSubmitting, counts],
  );

  const increment = useCallback(
    (index: number) => {
      setCounts((prev) => {
        const total = prev.reduce((sum, count) => sum + count, 0);

        if (maxCount !== null && total >= maxCount) return prev;

        const next = [...prev];
        next[index] = (next[index] ?? 0) + 1;

        return next;
      });
    },
    [maxCount],
  );

  // 人数を直接入力する。全角数字は半角へ寄せ、上限を超える入力は切り詰める。
  // 桁数を絞っているのは、貼り付けなどで極端な値が入るのを防ぐため。
  const setCount = useCallback(
    (index: number, value: string) => {
      const digits = normalizeHalfWidthDigits(value).slice(0, 4);
      const parsed = digits === "" ? 0 : Number(digits);

      setCounts((prev) => {
        const next = [...prev];

        if (maxCount === null) {
          next[index] = parsed;

          return next;
        }

        // 他カテゴリで既に埋まっている分を除いた枠までしか入力できない
        const others = prev.reduce(
          (sum, count, i) => (i === index ? sum : sum + count),
          0,
        );

        next[index] = Math.min(parsed, Math.max(0, maxCount - others));

        return next;
      });
    },
    [maxCount],
  );

  const decrement = useCallback((index: number) => {
    setCounts((prev) => {
      if ((prev[index] ?? 0) <= 0) return prev;

      const next = [...prev];
      next[index] = (next[index] ?? 0) - 1;

      return next;
    });
  }, []);

  const touchUsername = useCallback(() => {
    setTouched((prev) => ({ ...prev, username: true }));
  }, []);

  const touchMailAddress = useCallback(() => {
    setTouched((prev) => ({ ...prev, mailAddress: true }));
  }, []);

  // 状態を初期化する。モーダルを開き直したときに前回の入力を残さないため。
  const reset = useCallback(() => {
    setCurrentStep(steps[0]);
    setCounts(createInitialCounts(resolvedCosts));
    setUsername("");
    setMailAddress("");
    setTouched({ username: false, mailAddress: false });
    setIsSubmitting(false);
  }, [steps, resolvedCosts]);

  // お客様情報へ戻る。入力値は保持したままなので、そのまま直して進み直せる。
  const goBack = useCallback(() => {
    if (!canGoBack) return;

    setCurrentStep(ParticipationStepId.GuestInfo);
  }, [canGoBack]);

  // 次のステップへ進む。未入力のまま押された場合はエラーを表示して留まる。
  const goNext = useCallback(() => {
    if (step !== ParticipationStepId.GuestInfo) return;

    if (!canGoNext) {
      setTouched({ username: true, mailAddress: true });
      return;
    }

    setCurrentStep(ParticipationStepId.Count);
  }, [step, canGoNext]);

  // 参加申し込みを送信する。
  //
  // 人数はカテゴリ別内訳（participants）で送る。カテゴリにはイベント詳細の
  // costs[].category を指定し、0人のカテゴリは含めない。合計人数（partySize）は
  // サーバー側が内訳から算出するため送信しない。
  // ログイン時はセッションの情報を、未ログイン時は入力値をトークン無しで送る。
  const submit = useCallback(() => {
    if (!canSubmit) return;

    // カテゴリ別内訳を組立。0人カテゴリは除外する。
    const participants: ParticipantEntry[] = resolvedCosts
      .map((cost, index) => ({
        category: cost.category,
        headCount: counts[index] ?? 0,
      }))
      .filter((entry) => entry.headCount > 0);

    // 防御: イベントの costs に存在しないカテゴリ（フォールバック由来等）が
    // 含まれる場合は送信しない。要件上 costs は空にならない前提だが、
    // 万一不正データが入った場合に API の 400 を避けるための最小限のガード。
    const realCategories = (costs ?? []).map((cost) => cost.category.trim());
    if (
      participants.length === 0 ||
      participants.some((entry) => !realCategories.includes(entry.category))
    ) {
      toast.error(
        "このイベントは費用カテゴリが設定されていないため参加申し込みできません。",
      );
      return;
    }

    setIsSubmitting(true);

    void (async () => {
      try {
        if (isAuthenticated) {
          // モック環境ではセッションに email / name が欠けることがあるため既定値で補う。
          const isMock = isMockAuthEnabled();
          const sessionMailAddress =
            session?.email ?? (isMock ? MOCK_AUTH_SESSION.email : "");
          const sessionUsername =
            session?.name ?? (isMock ? MOCK_AUTH_SESSION.name : "");

          if (!sessionMailAddress || !sessionUsername) {
            toast.error(
              "ユーザー情報が取得できませんでした。再度ログインしてください。",
            );
            return;
          }

          await participateEvent(eventId, {
            mailAddress: sessionMailAddress,
            username: sessionUsername,
            participants,
          });
        } else {
          await participateEvent(
            eventId,
            {
              mailAddress: mailAddress.trim(),
              username: username.trim(),
              participants,
            },
            { auth: false },
          );
        }

        setCurrentStep(ParticipationStepId.Complete);
        onSuccess?.();
      } catch (error) {
        notifyParticipateError(error);
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [
    canSubmit,
    isAuthenticated,
    session,
    eventId,
    resolvedCosts,
    counts,
    costs,
    mailAddress,
    username,
    onSuccess,
  ]);

  return {
    step,
    steps,
    costs: resolvedCosts,
    counts,
    summary,
    maxCount,
    isAtCapacity,
    isAuthenticated,
    username,
    mailAddress,
    errors,
    isSubmitting,
    canGoNext,
    canGoBack,
    canSubmit,
    canIncrement,
    canDecrement,
    setUsername,
    setMailAddress,
    touchUsername,
    touchMailAddress,
    increment,
    decrement,
    setCount,
    goNext,
    goBack,
    submit,
    reset,
  };
}
