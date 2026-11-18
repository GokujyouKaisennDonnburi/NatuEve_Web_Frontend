"use client";

import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormTextarea } from "@/components/atoms/FormTextarea";
import { PillButton } from "@/components/atoms/PillButton";
import { FormField } from "@/components/molecules/FormField";
import { cn } from "@/lib/utils";

export const CONTACT_CATEGORIES = [
  { value: "request", label: "要望" },
  { value: "bug", label: "不具合報告" },
  { value: "report", label: "通報" },
  { value: "other", label: "その他お問い合わせ" },
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["value"];

// 送信 API は別 Issue。この時点ではモックアップとしてトーストだけを出す。
const SUBMIT_TOAST_MESSAGE = "お問い合わせを送信しました";

const CATEGORY_ERROR_MESSAGE = "お問い合わせ内容を選択してください";

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

// お問い合わせフォーム。送信は別 Issue で実装するため、
// ここではカテゴリの必須チェックとトースト表示までを行う。
export function ContactForm() {
  const formId = useId();
  const categoryId = `${formId}-category`;
  const messageId = `${formId}-message`;

  const [category, setCategory] = useState<ContactCategory | null>(null);
  const [message, setMessage] = useState("");
  const [categoryError, setCategoryError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!category) {
      setCategoryError(CATEGORY_ERROR_MESSAGE);
      return;
    }

    setCategoryError(undefined);
    toast.success(SUBMIT_TOAST_MESSAGE);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        id={categoryId}
        label="お問い合わせ内容"
        required
        error={categoryError}
      >
        {/* ラジオ本体は sr-only のため、グループには aria-label で項目名を渡す */}
        <div
          role="radiogroup"
          aria-label="お問い合わせ内容"
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
                  // クリック範囲と label の関連付けのため、先頭のラジオに id を渡す
                  id={index === 0 ? categoryId : undefined}
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
        label="要望"
        optional
        hint="ご意見・ご要望などを自由にご記入ください"
      >
        <FormTextarea
          id={messageId}
          rows={6}
          className="resize-y"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="例: イベント検索の条件をもっと増やしてほしい"
        />
      </FormField>

      <PillButton type="submit" className="w-full">
        送信する
      </PillButton>
    </form>
  );
}
