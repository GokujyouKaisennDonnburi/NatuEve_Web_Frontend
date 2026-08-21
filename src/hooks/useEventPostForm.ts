"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { showCompletionToast } from "@/components/molecules/CompletionToast";
import type { PriceCategory } from "@/components/molecules/event-post/PriceCategoryField";
import type { RequiredItem } from "@/components/molecules/event-post/RequiredItemField";
import {
  MAX_TAG_COUNT,
  MAX_TAG_LENGTH,
  MAX_TEXT_LENGTH,
} from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { createEvent } from "@/services/event";
import { uploadFile, uploadFiles } from "@/services/upload";
import type { CreateEventRequest } from "@/types/event";
import type { TagItem } from "@/types/tag";
import { UploadValidationError } from "@/utils/upload";
import { buildLocation } from "@/utils/regionSearch";

// イベント投稿フォームの入力状態を管理する型定義
export type EventPostFormState = {
  eventName: string; // イベントタイトル
  eventContent: string; // イベント概要
  eventImage: File | null; // イベント画像ファイル
  eventDocuments: File[]; // イベント資料ファイルの配列
  prefecture: string; // 都道府県
  city: string; // 市区町村
  address: string; // 番地・施設名等（任意）
  eventDateTime: string; // 開催日時
  endDateTime: string; // 終了日時
  feeCategoryGroups: PriceCategory[]; // 参加費用のカテゴリと金額の配列
  capacity: string; // 定員数
  applicationUrl: string; // 申し込みURL（空欄ならなちゅいべ内で受付）
  requiredItems: RequiredItem[]; // 持ち物の配列
  tags: TagItem[]; // タグの配列
};

// イベント投稿フォームの入力エラーを管理する型定義
export type EventPostFormErrors = {
  eventName?: string;
  eventContent?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  eventDateTime?: string;
  endDateTime?: string;
  feeCategoryGroups?: Record<number, string>;
  capacity?: string;
  applicationUrl?: string;
  requiredItems?: Record<number, string>;
  tags?: string;
};

const isValidLocalDateTime = (value: string) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const toRfc3339 = (value: string) => new Date(value).toISOString();

// フォーム初期状態
const INITIAL_STATE: EventPostFormState = {
  eventName: "",
  eventContent: "",
  eventImage: null,
  eventDocuments: [],
  prefecture: "",
  city: "",
  address: "",
  eventDateTime: "",
  endDateTime: "",
  // 1行だけ空の状態で用意する。初期値を入れると、そのまま送信されて
  // 意図しない費用区分が登録されるため、入力は利用者に委ねる。
  feeCategoryGroups: [{ category: "", amount: "" }],
  capacity: "",
  applicationUrl: "",
  requiredItems: [],
  tags: [],
};

// イベント投稿フォームの状態・検証・送信をまとめて扱うフック。
// 画面側は表示に専念できるよう、API 呼び出しまでをここに閉じる。
export function useEventPostForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<EventPostFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<EventPostFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームの特定のフィールドの値を更新する関数
  const setField = <K extends keyof EventPostFormState>(
    key: K,
    value: EventPostFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // 画像を presign → R2 直 PUT し、イベント作成に渡す objectKey を返す。
  // presign の有効期限は 5 分のため、送信直前（submit 内）に呼ぶ。
  const uploadEventImage = async (file: File | null) => {
    if (!file) {
      return null;
    }
    return uploadFile(file, "image");
  };

  // PDF を順番に presign → R2 直 PUT し、objectKey の配列を返す。
  // 1 件でも失敗したら例外が伝播し submit が中断される。
  const uploadEventDocuments = async (files: File[]) => {
    if (files.length === 0) {
      return [];
    }
    return uploadFiles(files, "pdf");
  };

  // フォームの入力値を検証する関数
  const validate = () => {
    const nextErrors: EventPostFormErrors = {};

    // 必須項目の検証
    if (!formState.eventName.trim()) {
      nextErrors.eventName = "イベントタイトルは必須です。";
    } else if (formState.eventName.trim().length > MAX_TEXT_LENGTH) {
      nextErrors.eventName =
        "イベントタイトルは255文字以内で入力してください。";
    }

    if (!formState.eventContent.trim()) {
      nextErrors.eventContent = "イベント概要は必須です。";
    }

    if (!formState.prefecture.trim()) {
      nextErrors.prefecture = "都道府県を選択してください。";
    }

    if (!formState.city.trim()) {
      nextErrors.city = "市区町村を選択してください。";
    }

    if (formState.address.trim().length > MAX_TEXT_LENGTH) {
      nextErrors.address = "番地・施設名等は255文字以内で入力してください。";
    }

    if (!formState.eventDateTime.trim()) {
      nextErrors.eventDateTime = "開催日時は必須です。";
    } else if (!isValidLocalDateTime(formState.eventDateTime.trim())) {
      nextErrors.eventDateTime = "開催日時の形式が正しくありません。";
    }

    if (!formState.endDateTime.trim()) {
      nextErrors.endDateTime = "終了日時は必須です。";
    } else if (!isValidLocalDateTime(formState.endDateTime.trim())) {
      nextErrors.endDateTime = "終了日時の形式が正しくありません。";
    } else if (
      // 開催日時が不正なときは比較できないため、開催日時が妥当な場合のみ前後関係を検証する。
      !nextErrors.eventDateTime &&
      new Date(formState.endDateTime.trim()).getTime() <=
        new Date(formState.eventDateTime.trim()).getTime()
    ) {
      nextErrors.endDateTime =
        "終了日時は開催日時より後の日時を指定してください。";
    }

    // 参加費用の検証（カテゴリと金額が揃っているか）
    const feeErrors: Record<number, string> = {};
    if (formState.feeCategoryGroups.length === 0) {
      nextErrors.feeCategoryGroups = {
        0: "参加費用は1件以上入力してください。",
      };
    }
    formState.feeCategoryGroups.forEach((group, index) => {
      const hasCategory = Boolean(group.category.trim());
      const hasAmount = Boolean(group.amount.trim());

      if (!hasCategory && !hasAmount) {
        feeErrors[index] = "カテゴリと金額は必須です。";
      } else if (!hasCategory) {
        feeErrors[index] = "カテゴリは必須です。";
      } else if (!hasAmount) {
        feeErrors[index] = "金額は必須です。";
      } else if (!/^\d+$/.test(group.amount.trim())) {
        feeErrors[index] = "金額は数字で入力してください。";
      }
    });
    // 参加費用のエラーがある場合、次のエラーオブジェクトに追加
    if (Object.keys(feeErrors).length > 0) {
      nextErrors.feeCategoryGroups = feeErrors;
    }

    // 持ち物の検証（持ち物名が空でないか）
    const requiredItemErrors: Record<number, string> = {};
    formState.requiredItems.forEach((item, index) => {
      if (!item.itemName.trim()) {
        requiredItemErrors[index] = "持ち物を入力してください。";
      } else if (item.itemName.trim().length > MAX_TEXT_LENGTH) {
        requiredItemErrors[index] = "持ち物は255文字以内で入力してください。";
      }
    });
    if (Object.keys(requiredItemErrors).length > 0) {
      nextErrors.requiredItems = requiredItemErrors;
    }

    // 定員数の検証（0以上の整数であるか）
    if (
      formState.capacity.trim() &&
      (!/^\d+$/.test(formState.capacity.trim()) ||
        Number(formState.capacity) < 0)
    ) {
      nextErrors.capacity = "定員数は0以上の整数で入力してください。";
    }

    // 申し込みURLの検証（入力があるときだけ形式を確認する）
    const trimmedApplicationUrl = formState.applicationUrl.trim();
    if (trimmedApplicationUrl) {
      if (trimmedApplicationUrl.length > MAX_TEXT_LENGTH) {
        nextErrors.applicationUrl =
          "申し込みURLは255文字以内で入力してください。";
      } else {
        try {
          const parsedUrl = new URL(trimmedApplicationUrl);
          if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
          ) {
            nextErrors.applicationUrl =
              "申し込みURLは http か https で始めてください。";
          }
        } catch {
          // URLオブジェクトの生成に失敗した場合、エラーとして設定
          nextErrors.applicationUrl = "正しいURL形式で入力してください。";
        }
      }
    }

    // タグの検証（件数・空文字・文字数・重複）。
    // API 上 tagIds は任意だが、検索性を確保するため画面では1件以上を必須にしている。
    if (formState.tags.length === 0) {
      nextErrors.tags = "タグは1件以上追加してください。";
    } else if (formState.tags.length > MAX_TAG_COUNT) {
      nextErrors.tags = `タグは最大${MAX_TAG_COUNT}件までです。`;
    } else {
      const tagSet = new Set<string>();
      for (const tag of formState.tags) {
        const trimmed = tag.name.trim();
        if (!trimmed) {
          nextErrors.tags = "タグに空文字は指定できません。";
          break;
        }
        if (trimmed.length > MAX_TAG_LENGTH) {
          nextErrors.tags = `タグは1つあたり${MAX_TAG_LENGTH}文字以内で入力してください。`;
          break;
        }
        if (tagSet.has(trimmed)) {
          nextErrors.tags = "同じタグが重複しています。";
          break;
        }
        tagSet.add(trimmed);
      }
    }

    return nextErrors;
  };

  // フォームの送信イベントハンドラー
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    // 入力値の検証を行い、エラーがあればエラー状態を更新
    const nextErrors = validate();
    setErrors(nextErrors);

    // エラーが存在する場合、送信処理を中断
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 送信フロー:
      // 1. 画像と PDF を presign → R2 へ直接 PUT する
      // 2. 返却された objectKey をイベント作成 API に渡す
      const uploadedImage = await uploadEventImage(formState.eventImage);
      const uploadedPdfs = await uploadEventDocuments(formState.eventDocuments);

      // フォーム state を本番 API（CreateEventRequest）の契約に合わせて変換する。
      // 任意項目（capacity / externalUrl / items / objectKeys）は値があるときだけ付与する。
      const trimmedCapacity = formState.capacity.trim();

      const payload: CreateEventRequest = {
        title: formState.eventName.trim(),
        description: formState.eventContent.trim(),
        location: buildLocation(
          formState.prefecture,
          formState.city,
          formState.address,
        ),
        eventDate: toRfc3339(formState.eventDateTime),
        endDate: toRfc3339(formState.endDateTime),
        costs: formState.feeCategoryGroups.map((group) => ({
          category: group.category.trim(),
          cost: Number(group.amount),
        })),
      };

      if (trimmedCapacity) {
        payload.capacity = Number(trimmedCapacity);
      }

      const trimmedApplicationUrl = formState.applicationUrl.trim();
      if (trimmedApplicationUrl) {
        payload.externalUrl = trimmedApplicationUrl;
      }

      if (formState.requiredItems.length > 0) {
        payload.items = formState.requiredItems.map((item) => ({
          item: item.itemName.trim(),
          isRequired: item.isRequired,
        }));
      }

      if (formState.tags.length > 0) {
        payload.tagIds = formState.tags.map((tag) => tag.id);
      }

      if (uploadedImage) {
        payload.imageObjectKeys = [uploadedImage.objectKey];
        payload.imageFilenames = [uploadedImage.filename];
      }

      if (uploadedPdfs.length > 0) {
        payload.pdfObjectKeys = uploadedPdfs.map((file) => file.objectKey);
        payload.pdfFilenames = uploadedPdfs.map((file) => file.filename);
      }

      await createEvent(payload);

      showCompletionToast("イベントを投稿しました");
      router.push(ROUTES.EVENT_LIST);
    } catch (error) {
      console.error("イベント情報の登録に失敗しました。", error);
      // ファイルは FileDropZone が選択時点で弾くため、uploadFile の検証に
      // 引っかかるのは想定外の経路のときだけ。原因が具体的に分かっているので、
      // 一律の文言で覆い隠さずそのまま伝える。
      toast.error(
        error instanceof UploadValidationError
          ? error.message
          : "イベント情報の登録に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formState, errors, isSubmitting, setField, handleSubmit };
}
