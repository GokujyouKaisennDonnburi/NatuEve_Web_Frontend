"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { participateEvent } from "@/services/participate";
import { ParticipateError, ParticipateErrorCode } from "@/types/participate";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

// 参加申し込みボタンのプロパティ
type EventParticipationButtonProps = {
  eventId: string;
  disabled?: boolean; // 主催者自身のイベントなどで、参加申し込みを無効化するためのフラグ
};

// 参加申し込みのエラーを種別ごとにトーストへ振り分ける
const handleParticipateError = (error: unknown) => {
  if (error instanceof ParticipateError) {
    switch (error.code) {
      // 既に参加している場合
      case ParticipateErrorCode.Conflict:
        toast.error(error.message || "既に参加しています。");
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
}: EventParticipationButtonProps) {
  const { session, isLoading: isSessionLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ログイン時はトークン付きで送信
  const handleSubmitForLoggedInUser = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // セッションのメールアドレスとユーザー名をそのまま使用する
      const mailAddress = session?.email ?? "";
      const username = session?.name ?? "";

      // 必須項目が欠損している場合は送信せず、再ログインを促す
      if (!mailAddress || !username) {
        toast.error("ユーザー情報が取得できませんでした。再度ログインしてください。");
        return;
      }

      await participateEvent(eventId, { mailAddress, username });
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

  return (
    <>
      <Button
        size="lg"
        className="w-full cursor-pointer rounded-full bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-600 px-6 py-6 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-teal-500/30 focus-visible:ring-teal-500/30 disabled:opacity-50"
        disabled={disabled || isSessionLoading || isSubmitting}
        onClick={handleButtonClick}
      >
        {isSubmitting ? "送信中…" : "参加申し込み"}
      </Button>

      {isModalOpen ? (
        <GuestParticipationModal
          eventId={eventId}
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
  onClose: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
};

// 未ログイン時の参加申し込みモーダルコンポーネント
const GuestParticipationModal = ({
  eventId,
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
        { mailAddress: trimmedEmail, username: trimmedName },
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
