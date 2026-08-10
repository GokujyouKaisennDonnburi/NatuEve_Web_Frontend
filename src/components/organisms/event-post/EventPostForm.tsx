"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId } from "react";

import { FormInput } from "@/components/atoms/FormInput";
import { FormTextarea } from "@/components/atoms/FormTextarea";
import { PillButton } from "@/components/atoms/PillButton";
import { PaymentAlertNote } from "@/components/atoms/event-post/PaymentAlertNote";
import { FileDropZone } from "@/components/molecules/FileDropZone";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";
import { UnitInput } from "@/components/molecules/UnitInput";
import { PriceCategoryField } from "@/components/molecules/event-post/PriceCategoryField";
import { RequiredItemField } from "@/components/molecules/event-post/RequiredItemField";
import { TagInputField } from "@/components/molecules/event-post/TagInputField";
import { MAX_EVENT_PDF_COUNT, MAX_TEXT_LENGTH } from "@/constants/config";
import type { EventPostFormErrors } from "@/hooks/useEventPostForm";
import { useEventPostForm } from "@/hooks/useEventPostForm";
import { normalizeHalfWidthDigits } from "@/utils/format";
import { MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "@/utils/upload";

import {
  EVENT_ATTACHMENTS_SECTION_ID,
  EVENT_FEE_SECTION_ID,
  EVENT_ITEMS_SECTION_ID,
  EVENT_OVERVIEW_SECTION_ID,
  EVENT_SCHEDULE_SECTION_ID,
  EVENT_TAGS_SECTION_ID,
  EVENT_TITLE_SECTION_ID,
} from "./eventPostTocSections";

// 日付の年部分を4桁に制限する（YYYY-MM-DD形式を想定）。
// datetime-local は 5 桁以上の年も受け付けてしまうため、入力時に切り詰める。
const clampDateYear = (value: string) => {
  const [yearPart, ...rest] = value.split("-");
  if (!yearPart) {
    return value;
  }

  const normalizedYear = normalizeHalfWidthDigits(yearPart).slice(0, 4);
  return [normalizedYear, ...rest].join("-");
};

// 上限バイト数の表記は、実際の検証に使う値から作ることでズレを防ぐ
const toMegabytes = (bytes: number) => Math.floor(bytes / (1024 * 1024));

// 送信時に最初のエラー項目へジャンプするための、フォームの表示順。
// 下の JSX の並び順と対応させる必要があるため、JSX を変更した際はここも合わせて見直すこと。
const FORM_ERROR_ORDER: readonly (keyof EventPostFormErrors)[] = [
  "eventName",
  "tags",
  "location",
  "eventDateTime",
  "endDateTime",
  "capacity",
  "applicationUrl",
  "feeCategoryGroups",
  "requiredItems",
  "eventContent",
];

// 参加費用・持ち物は行の増減がある項目で、入力欄の id は子コンポーネント内の
// useId() から生成されるため親からは個々の id を知れない。そのため、
// セクション要素の id を起点に中の最初のエラー項目を探す。
const SECTION_ANCHOR_IDS: Partial<Record<keyof EventPostFormErrors, string>> = {
  feeCategoryGroups: EVENT_FEE_SECTION_ID,
  requiredItems: EVENT_ITEMS_SECTION_ID,
};

// イベント投稿フォーム。入力項目を意味のまとまりごとにカードへ分けて並べる。
export function EventPostForm() {
  const formId = useId();
  const router = useRouter();
  const { formState, errors, isSubmitting, setField, handleSubmit } =
    useEventPostForm();

  const getFieldId = useCallback(
    (suffix: string) => `${formId}-${suffix}`,
    [formId],
  );

  // 送信時、表示順で一番上のエラー項目へスクロール＋フォーカスする。
  // errors は送信時にのみ更新されるため、初回マウント時や送信成功時
  // （errors が空のとき）はここで何もせず抜ける。
  useEffect(() => {
    const firstErrorKey = FORM_ERROR_ORDER.find((key) => {
      const value = errors[key];
      if (typeof value === "string") {
        return value.length > 0;
      }
      if (value) {
        return Object.keys(value).length > 0;
      }
      return false;
    });

    if (!firstErrorKey) {
      return;
    }

    const sectionId = SECTION_ANCHOR_IDS[firstErrorKey];
    const target = sectionId
      ? document
          .getElementById(sectionId)
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      : document.getElementById(getFieldId(firstErrorKey));

    if (target) {
      // focus によって一瞬でジャンプしてしまうため、先にスクロールを止めてから
      // 改めて滑らかにスクロールさせる。
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // 行が0件でエラーだけが出るケース（例: 参加費用が1件も無い）の保険として、
    // 入力欄が見つからない場合はセクション自体へスクロールする。
    if (sectionId) {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors, getFieldId]);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div id={EVENT_TITLE_SECTION_ID} className="scroll-mt-6">
        <FormCard>
          <FormField
            id={getFieldId("eventName")}
            label="イベントタイトル"
            required
            error={errors.eventName}
          >
            <FormInput
              id={getFieldId("eventName")}
              maxLength={MAX_TEXT_LENGTH}
              value={formState.eventName}
              onChange={(event) => setField("eventName", event.target.value)}
              placeholder="例: 里山観察ワークショップ"
              aria-invalid={Boolean(errors.eventName)}
            />
          </FormField>
        </FormCard>
      </div>

      <div id={EVENT_TAGS_SECTION_ID} className="scroll-mt-6">
        <FormCard>
          <TagInputField
            id={getFieldId("tags")}
            tags={formState.tags}
            onTagsChange={(tags) => setField("tags", tags)}
            error={errors.tags}
          />
        </FormCard>
      </div>

      <div id={EVENT_SCHEDULE_SECTION_ID} className="scroll-mt-6">
        <FormCard title="開催情報">
          <FormField
            id={getFieldId("location")}
            label="開催場所"
            required
            error={errors.location}
          >
            <FormInput
              id={getFieldId("location")}
              maxLength={MAX_TEXT_LENGTH}
              value={formState.location}
              onChange={(event) => setField("location", event.target.value)}
              placeholder="例: 〇〇市民ホール 2F 会議室A"
              aria-invalid={Boolean(errors.location)}
            />
          </FormField>

          <FormField
            id={getFieldId("eventDateTime")}
            label="開催日時"
            required
            error={errors.eventDateTime}
          >
            <FormInput
              id={getFieldId("eventDateTime")}
              type="datetime-local"
              value={formState.eventDateTime}
              onChange={(event) =>
                setField("eventDateTime", clampDateYear(event.target.value))
              }
              aria-invalid={Boolean(errors.eventDateTime)}
            />
          </FormField>

          <FormField
            id={getFieldId("endDateTime")}
            label="終了日時"
            required
            error={errors.endDateTime}
          >
            <FormInput
              id={getFieldId("endDateTime")}
              type="datetime-local"
              value={formState.endDateTime}
              onChange={(event) =>
                setField("endDateTime", clampDateYear(event.target.value))
              }
              aria-invalid={Boolean(errors.endDateTime)}
            />
          </FormField>

          <FormField
            id={getFieldId("capacity")}
            label="定員数"
            error={errors.capacity}
          >
            <UnitInput
              id={getFieldId("capacity")}
              unit="名"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formState.capacity}
              onChange={(event) =>
                setField(
                  "capacity",
                  normalizeHalfWidthDigits(event.target.value),
                )
              }
              placeholder="例: 30"
              aria-invalid={Boolean(errors.capacity)}
            />
          </FormField>

          <FormField
            id={getFieldId("applicationUrl")}
            label="申し込みURL"
            description="外部フォームに遷移させる場合に使います。"
            error={errors.applicationUrl}
          >
            <FormInput
              id={getFieldId("applicationUrl")}
              type="url"
              inputMode="url"
              maxLength={MAX_TEXT_LENGTH}
              value={formState.applicationUrl}
              onChange={(event) =>
                setField("applicationUrl", event.target.value)
              }
              placeholder="https://（なちゅいべ内で受付する場合は空欄）"
              aria-invalid={Boolean(errors.applicationUrl)}
            />
          </FormField>
        </FormCard>
      </div>

      <div id={EVENT_FEE_SECTION_ID} className="scroll-mt-6">
        <FormCard
          title="参加費用"
          required
          description="分類ごとに金額を設定できます。無料の場合は 0 と入力してください。"
        >
          {/* 当サイトでは決済を仲介しないため、支払い方法を概要へ書くよう促す */}
          <PaymentAlertNote />

          <PriceCategoryField
            items={formState.feeCategoryGroups}
            onItemsChange={(items) => setField("feeCategoryGroups", items)}
            errors={errors.feeCategoryGroups}
          />
        </FormCard>
      </div>

      <div id={EVENT_ITEMS_SECTION_ID} className="scroll-mt-6">
        <FormCard
          title="持ち物"
          description="「必須」にチェックした持ち物は、参加者向けに強調表示されます。"
        >
          <RequiredItemField
            items={formState.requiredItems}
            onItemsChange={(items) => setField("requiredItems", items)}
            errors={errors.requiredItems}
          />
        </FormCard>
      </div>

      <div id={EVENT_ATTACHMENTS_SECTION_ID} className="scroll-mt-6 space-y-4">
        <FormCard
          title="イベント画像"
          description="JPEG / PNG。告知バナーやサムネイルに使います。"
        >
          <FileDropZone
            id={getFieldId("eventImage")}
            accept="image/jpeg,image/png"
            files={formState.eventImage ? [formState.eventImage] : []}
            onFilesChange={(files) => setField("eventImage", files[0] ?? null)}
            promptLabel="クリックまたはドラッグで画像をアップロード"
            hint={`1ファイル ${toMegabytes(MAX_IMAGE_BYTES)}MB まで`}
          />
        </FormCard>

        <FormCard
          title="イベント資料"
          description={`しおり、アクセスマップ、同意書など。最大${MAX_EVENT_PDF_COUNT}つまでのPDFを選択できます。`}
        >
          <FileDropZone
            id={getFieldId("eventDocuments")}
            accept="application/pdf"
            files={formState.eventDocuments}
            onFilesChange={(files) => setField("eventDocuments", files)}
            maxFiles={MAX_EVENT_PDF_COUNT}
            promptLabel="クリックまたはドラッグでPDFをアップロード"
            hint={`1ファイル ${toMegabytes(MAX_PDF_BYTES)}MB まで`}
          />
        </FormCard>
      </div>

      <div id={EVENT_OVERVIEW_SECTION_ID} className="scroll-mt-6">
        <FormCard>
          <FormField
            id={getFieldId("eventContent")}
            label="イベント概要"
            required
            description="一覧やカードに表示される紹介文です。"
            error={errors.eventContent}
          >
            <FormTextarea
              id={getFieldId("eventContent")}
              rows={5}
              className="max-h-60 resize-y overflow-y-auto"
              value={formState.eventContent}
              onChange={(event) => setField("eventContent", event.target.value)}
              placeholder="一日のスケジュールや、イベントで何を行うかを書きましょう。"
              aria-invalid={Boolean(errors.eventContent)}
            />
          </FormField>
        </FormCard>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <PillButton
          tone="outline"
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          キャンセル
        </PillButton>
        <PillButton tone="brand" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "送信中…" : "イベントを投稿"}
        </PillButton>
      </div>
    </form>
  );
}
