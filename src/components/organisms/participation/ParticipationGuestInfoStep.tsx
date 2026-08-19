"use client";

import { FormInput } from "@/components/atoms/FormInput";
import { PillButton } from "@/components/atoms/PillButton";
import { FormField } from "@/components/molecules/FormField";
import { SignInPromoteBanner } from "@/components/molecules/participation/SignInPromoteBanner";
import type { ParticipationFieldErrors } from "@/hooks/useParticipationForm";
import { useEffect, useId, useRef } from "react";

type ParticipationGuestInfoStepProps = {
  username: string;
  mailAddress: string;
  errors: ParticipationFieldErrors;
  // 人数選択へ進めるか。未入力・形式不正のときは false になる。
  canGoNext: boolean;
  onUsernameChange: (value: string) => void;
  onMailAddressChange: (value: string) => void;
  onUsernameBlur: () => void;
  onMailAddressBlur: () => void;
  onBack: () => void;
  onNext: () => void;
};

// 未登録者向けの申し込みステップ。お名前とメールアドレスを受け取る。
//
// 入力の検証は UX 補助であり、信頼の境界は API 側にある。
export function ParticipationGuestInfoStep({
  username,
  mailAddress,
  errors,
  canGoNext,
  onUsernameChange,
  onMailAddressChange,
  onUsernameBlur,
  onMailAddressBlur,
  onBack,
  onNext,
}: Readonly<ParticipationGuestInfoStepProps>) {
  const usernameId = useId();
  const mailAddressId = useId();
  const usernameRef = useRef<HTMLInputElement>(null);

  // モーダルを開いた直後の操作起点を明示するため、先頭の入力欄へフォーカスする。
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <FormField
          id={usernameId}
          label="お名前"
          required
          // エラー表示中は補足を出さず、直すべき内容だけを見せる
          hint={errors.username ? undefined : "ニックネームでも構いません"}
          error={errors.username}
        >
          <FormInput
            ref={usernameRef}
            id={usernameId}
            type="text"
            autoComplete="name"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            onBlur={onUsernameBlur}
            placeholder="山田 花子"
            aria-invalid={Boolean(errors.username)}
          />
        </FormField>

        <FormField
          id={mailAddressId}
          label="メールアドレス"
          required
          hint={errors.mailAddress ? undefined : "確認メールをお送りします"}
          error={errors.mailAddress}
        >
          <FormInput
            id={mailAddressId}
            type="email"
            autoComplete="email"
            value={mailAddress}
            onChange={(event) => onMailAddressChange(event.target.value)}
            onBlur={onMailAddressBlur}
            placeholder="hanako.yamada@example.com"
            aria-invalid={Boolean(errors.mailAddress)}
          />
        </FormField>
      </div>

      <SignInPromoteBanner />

      <div className="space-y-3">
        <div className="flex justify-end gap-3">
          <PillButton type="button" tone="outline" onClick={onBack}>
            もどる
          </PillButton>

          <PillButton type="button" disabled={!canGoNext} onClick={onNext}>
            つぎへ
          </PillButton>
        </div>

        <p className="text-center text-xs text-slate-400">
          登録なしで申し込めます。
        </p>
      </div>
    </div>
  );
}
