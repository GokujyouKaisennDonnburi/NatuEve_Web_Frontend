"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_AUTH_SESSION, isMockAuthEnabled } from "@/services/mockAuth";
import { participateEvent } from "@/services/participate";
import { ParticipateError, ParticipateErrorCode } from "@/types/participate";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

// 参加申し込みボタンのプロパティ
type EventParticipationButtonProps = {
  eventId: string;
  disabled?: boolean; // 主催者自身のイベントなどで、参加申し込みを無効化するためのフラグ
  // イベントの定員（参加人数の上限）。未設定時は上限なし。
  capacity?: number;
};

// 参加申し込みのエラーを種別ごとにトーストへ振り分ける
const handleParticipateError = (error: unknown) => {
  if (error instanceof ParticipateError) {
    switch (error.code) {
      // 既に参加している場合
      case ParticipateErrorCode.AlreadyJoined:
        toast.error(error.message || "既に参加しています。");
        return;
      // 定員に達している場合
      case ParticipateErrorCode.CapacityFull:
        toast.error(error.message || "定員に達しています。");
        return;
      // 参加申し込みの権限がない場合
      case ParticipateErrorCode.Unauthorized:
        toast.error(error.message || "認証が必要です。");
        return;
      // イベントが見つからない場合
      case ParticipateErrorCode.NotFound:
        toast.error(error.message || "イベントが見つかりません。");
        return;
      // 入力内容に不備がある場合
      case ParticipateErrorCode.InvalidRequest:
        toast.error(error.message || "入力内容に不備があります。");
        return;
      // その他のエラー
      default:
        toast.error(error.message);
        return;
    }
  }

  console.error("参加申し込みに失敗しました。", error);
  toast.error("参加申し込みに失敗しました。時間をおいて再度お試しください。");
};

// 参加申し込みボタンコンポーネント
//
// ログイン時は Supabase セッション（Google プロフィール由来）のメールアドレスと
// ユーザー名をそのまま送信する。未ログイン時はモーダルで入力してもらって送信する。
// 送信結果はトーストで通知する。
export function EventParticipationButton({
  eventId,
  disabled,
  capacity,
}: EventParticipationButtonProps) {
  const { session, isLoading: isSessionLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 参加人数（代表者を含む）。初期値 1、最小値 1、上限は定員（capacity）があればそれ。
  const maxCount =
    typeof capacity === "number" && capacity >= 1 ? Math.floor(capacity) : null;
  const [participantCount, setParticipantCount] = useState(1);
  const countId = useId();

  // ログイン時はトークン付きで送信
  const handleSubmitForLoggedInUser = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // セッションのメールアドレスとユーザー名をそのまま使用する
      // モック環境下ではセッションに email/name が欠ける場合があるため、
      // モック既定値でフォールバックする
      const isMock = isMockAuthEnabled();
      const mailAddress =
        session?.email ?? (isMock ? MOCK_AUTH_SESSION.email : "");
      const username = session?.name ?? (isMock ? MOCK_AUTH_SESSION.name : "");

      // 必須項目が欠損している場合は送信せず、再ログインを促す
      if (!mailAddress || !username) {
        toast.error(
          "ユーザー情報が取得できませんでした。再度ログインしてください。",
        );
        return;
      }

      await participateEvent(eventId, {
        mailAddress,
        username,
        partySize: participantCount,
      });
      toast.success("参加申し込みを完了しました。");
    } catch (error) {
      handleParticipateError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 参加申し込みボタンのクリックハンドラ
  const handleButtonClick = () => {
    if (disabled) return;
    // セッション読み込み中は何もしない
    if (isSessionLoading) return;

    if (session?.token) {
      void handleSubmitForLoggedInUser();
    } else {
      setIsModalOpen(true);
    }
  };

  // 参加人数を減らす
  const handleDecrement = () => {
    if (disabled || isSessionLoading || isSubmitting) return;
    setParticipantCount((prev) => (prev <= 1 ? 1 : prev - 1));
  };

  // 参加人数を増やす
  const handleIncrement = () => {
    if (disabled || isSessionLoading || isSubmitting) return;
    setParticipantCount((prev) => {
      const next = prev + 1;
      return maxCount !== null && next > maxCount ? prev : next;
    });
  };

  // 参加人数の直接入力（数値入力欄）
  const handleCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isSessionLoading || isSubmitting) return;
    let next = Number(event.target.value);
    if (Number.isNaN(next) || next < 1) {
      next = 1;
    } else {
      next = Math.floor(next);
      if (maxCount !== null && next > maxCount) next = maxCount;
    }
    setParticipantCount(next);
  };

  // コントロールの無効状態を判定
  const isControlDisabled = disabled || isSessionLoading || isSubmitting;
  const canDecrement = !isControlDisabled && participantCount > 1;
  const canIncrement =
    !isControlDisabled && (maxCount === null || participantCount < maxCount);

  return (
    <>
      <Label htmlFor={countId} className="sr-only">
        参加人数
      </Label>
      <div
        className={`group flex h-10 w-full items-stretch overflow-hidden rounded-xl bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-600 shadow-lg shadow-teal-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-teal-500/30 focus-within:ring-2 focus-within:ring-teal-500/30 ${isControlDisabled ? "opacity-50" : ""}`}
      >
        {/* 左：メインアクション */}
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center justify-center px-6 text-base font-semibold text-white transition hover:bg-white/10 active:bg-white/20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          disabled={isControlDisabled}
          onClick={handleButtonClick}
        >
          {isSubmitting ? "送信中…" : "参加申し込み"}
        </button>
        {/* 区切り線 */}
        <div className="w-px bg-white/30" />
        {/* 右：人数変更エリア */}
        <div className="flex items-center gap-1 bg-white/10 px-3">
          <button
            type="button"
            aria-label="参加人数を1減らす"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg font-bold leading-none text-white transition hover:bg-white/20 active:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={!canDecrement}
            onClick={handleDecrement}
          >
            －
          </button>
          <Input
            id={countId}
            type="number"
            min={1}
            max={maxCount ?? undefined}
            step={1}
            inputMode="numeric"
            value={participantCount}
            onChange={handleCountChange}
            disabled={isControlDisabled}
            aria-label="参加人数"
            className="h-8 w-12 border-none bg-transparent px-0 text-center text-base font-semibold text-white [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="参加人数を1増やす"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg font-bold leading-none text-white transition hover:bg-white/20 active:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={!canIncrement}
            onClick={handleIncrement}
          >
            ＋
          </button>
        </div>
      </div>

      {/* 未ログイン時の参加申し込みモーダル */}
      {isModalOpen ? (
        <GuestParticipationModal
          eventId={eventId}
          participantCount={participantCount}
          onClose={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      ) : null}
    </>
  );
}

// 未ログイン時の参加申し込みモーダル
type GuestParticipationModalProps = {
  eventId: string;
  // 参加人数（代表者を含む）
  participantCount: number;
  onClose: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
};

// 未ログイン時の参加申し込みモーダルコンポーネント
const GuestParticipationModal = ({
  eventId,
  participantCount,
  onClose,
  isSubmitting,
  setIsSubmitting,
}: GuestParticipationModalProps) => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const emailId = useId();
  const nameId = useId();

  // 未ログイン時のメールアドレス入力欄の参照を保持する
  const emailRef = useRef<HTMLInputElement>(null);

  // Escape キーでモーダルを閉じる
  useEffect(() => {
    emailRef.current?.focus(); // メールアドレス入力欄にフォーカスする
    document.body.style.overflow = "hidden"; // 背景のスクロールを無効化する

    // Escape キーでモーダルを閉じる処理
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    // Escape キーのイベントリスナーを追加
    window.addEventListener("keydown", handleKeyDown);

    // クリーンアップ関数でイベントリスナーを削除
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  // 参加申し込みフォームの送信処理
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    // UX 補助の簡易バリデーション（信頼の境界は API 側）
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    if (!trimmedEmail || !trimmedName) {
      toast.error("メールアドレスとユーザー名を入力してください。");
      return;
    }

    setIsSubmitting(true);

    // 参加申し込み API を呼び出す
    try {
      await participateEvent(
        eventId,
        {
          mailAddress: trimmedEmail,
          username: trimmedName,
          partySize: participantCount,
        },
        { auth: false },
      );
      toast.success("参加申し込みを完了しました。");
      onClose();
    } catch (error) {
      handleParticipateError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景オーバーレイ：ボタンとして振るわせ、クリックで閉じる */}
      <button
        type="button"
        aria-label="参加申し込みを閉じる"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        tabIndex={-1}
      />
      <div
        className="relative w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participation-modal-title"
      >
        <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-1">
              <h2
                id="participation-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                参加申し込み
              </h2>
              <p className="text-sm text-slate-600">
                参加にはメールアドレスとお名前が必要です。入力をお願いします。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor={emailId}>メールアドレス</Label>
                <Input
                  ref={emailRef}
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="例: nature@example.com"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={nameId}>ユーザー名</Label>
                <Input
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="例: 山田 はなこ"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={onClose}
                  className="cursor-pointer"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white"
                >
                  {isSubmitting ? "送信中…" : "送信する"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventParticipationButton;
