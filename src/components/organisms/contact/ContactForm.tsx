"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormTextarea } from "@/components/atoms/FormTextarea";
import { PillButton } from "@/components/atoms/PillButton";
import { FormField } from "@/components/molecules/FormField";
import { MAX_CONTACT_MESSAGE_LENGTH } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { createContact } from "@/services/contact";
import type { ContactCategory } from "@/types/contact";
import { validateNotificationText } from "@/utils/notificationText";

// 値は types/contact.ts の ContactCategory と一致させる
export const CONTACT_CATEGORIES = [
  { value: "request", label: "要望" },
  { value: "bug", label: "不具合報告" },
  { value: "other", label: "その他お問い合わせ" },
] as const satisfies readonly { value: ContactCategory; label: string }[];

// 送信 API（POST /api/v1/contact）の受付完了（202）を伝える
const SUBMIT_TOAST_MESSAGE = "お問い合わせを送信しました";

const SUBMIT_ERROR_MESSAGE =
  "お問い合わせの送信に失敗しました。時間をおいて再度お試しください。";

const CATEGORY_ERROR_MESSAGE = "お問い合わせ内容を選択してください";

const MESSAGE_LENGTH_ERROR_MESSAGE = `詳細は${MAX_CONTACT_MESSAGE_LENGTH}文字以内で入力してください。`;

// 可視ラベルと radiogroup の読み上げ名で共有するため、定数に切り出す
const CATEGORY_FIELD_LABEL = "お問い合わせ内容";

const CATEGORY_ROW_CLASS_NAME = cn(
  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors duration-200",
  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-(--brand-green)/30",
);

const CATEGORY_ROW_IDLE_CLASS_NAME =
  "border-slate-200 bg-white text-slate-700 hover:border-(--brand-green-line) hover:bg-(--brand-green-soft)";

const CATEGORY_ROW_ACTIVE_CLASS_NAME =
  "border-(--brand-green-line) bg-(--brand-green-soft) font-medium text-slate-900";

const CATEGORY_DOT_CLASS_NAME =
  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200";

// お問い合わせフォーム。カテゴリの必須チェックと詳細の文字数上限チェックを行い、
// 送信 API（POST /api/v1/contact）の呼び出しと結果のフィードバックまでを行う。
export function ContactForm() {
  const router = useRouter();
  const formId = useId();
  const categoryId = `${formId}-category`;
  const messageId = `${formId}-message`;

  const [category, setCategory] = useState<ContactCategory | null>(null);
  const [message, setMessage] = useState("");
  const [categoryError, setCategoryError] = useState<string>();
  const [messageError, setMessageError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 送信ボタンは非活性にしているが、Enter 連打などの経路でも二重送信しないようにする
    if (isSubmitting) {
      return;
    }

    if (!category) {
      setCategoryError(CATEGORY_ERROR_MESSAGE);
      return;
    }

    // API と同じく前後の空白を除いた上で、1コードポイント単位で文字数を数える
    // （絵文字を HTML の maxLength で数えると2文字分になるため、maxLength 属性は使わない）。
    const { tooLong } = validateNotificationText(
      message,
      MAX_CONTACT_MESSAGE_LENGTH,
    );
    if (tooLong) {
      setMessageError(MESSAGE_LENGTH_ERROR_MESSAGE);
      return;
    }

    setCategoryError(undefined);
    setMessageError(undefined);
    setIsSubmitting(true);

    void (async () => {
      try {
        await createContact({ category, message });
        toast.success(SUBMIT_TOAST_MESSAGE);

        // フッターなどあらゆる画面から来られるため、履歴があれば元の画面へ戻す。
        // 履歴がない（直接アクセスなど）場合はイベント一覧へ遷移する。
        // ※ window.history.length はアプリ外の履歴も数えるため、外部サイト経由の
        //   アクセスでは戻り先がアプリ外になる余地がある。returnTo の扱いは
        //   別 Issue で見直す。
        if (window.history.length <= 1) {
          router.push(ROUTES.EVENT_LIST);
        } else {
          router.back();
        }
      } catch (error) {
        // API が返したメッセージ（検証エラー・受付上限・サーバーエラー）を優先して伝える
        console.error("お問い合わせの送信に失敗しました。", error);
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : SUBMIT_ERROR_MESSAGE,
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        id={categoryId}
        label={CATEGORY_FIELD_LABEL}
        required
        error={categoryError}
      >
        {/* ラジオ本体は sr-only のため、グループには aria-label で項目名を渡す */}
        <div
          role="radiogroup"
          aria-label={CATEGORY_FIELD_LABEL}
          className="space-y-2"
        >
          {CONTACT_CATEGORIES.map((option, index) => {
            const isSelected = option.value === category;

            return (
              <label
                key={option.value}
                className={cn(
                  CATEGORY_ROW_CLASS_NAME,
                  isSelected
                    ? CATEGORY_ROW_ACTIVE_CLASS_NAME
                    : CATEGORY_ROW_IDLE_CLASS_NAME,
                )}
              >
                <input
                  type="radio"
                  name={`${formId}-category-group`}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => {
                    setCategory(option.value);
                    setCategoryError(undefined);
                  }}
                  // 先頭のラジオに id を渡して可視ラベル（htmlFor）と関連付ける。
                  // 可視ラベルとの結合で読み上げ名が不揃いにならないよう、
                  // 選択肢名を aria-label で明示する。
                  id={index === 0 ? categoryId : undefined}
                  aria-label={option.label}
                  className="sr-only"
                  aria-invalid={Boolean(categoryError)}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    CATEGORY_DOT_CLASS_NAME,
                    isSelected
                      ? "border-(--brand-green) bg-(--brand-green)"
                      : "border-(--form-border) bg-white",
                  )}
                >
                  {isSelected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
                {option.label}
              </label>
            );
          })}
        </div>
      </FormField>

      <FormField
        id={messageId}
        label="詳細"
        optional
        description="ご意見・ご要望などを自由にご記入ください"
        error={messageError}
      >
        <FormTextarea
          id={messageId}
          rows={6}
          className="resize-y"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setMessageError(undefined);
          }}
          aria-invalid={Boolean(messageError)}
          placeholder="例: イベント検索の条件をもっと増やしてほしい"
        />
      </FormField>

      <PillButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "送信する"}
      </PillButton>
    </form>
  );
}
