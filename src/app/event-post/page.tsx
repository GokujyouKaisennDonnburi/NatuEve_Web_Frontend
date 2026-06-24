"use client";

import { FileText, MapPinned, Megaphone, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { EventPostSubmitButton } from "@/components/atoms/event-post/EventPostSubmitButton";
import { SectionHeading } from "@/components/atoms/event-post/SectionHeading";
import { FileField } from "@/components/molecules/event-post/FileField";
import { FormField } from "@/components/molecules/event-post/FormField";
import { OptionalUrlField } from "@/components/molecules/event-post/OptionalUrlField";
import {
  type PriceCategory,
  PriceCategoryField,
} from "@/components/molecules/event-post/PriceCategoryField";
import {
  type RequiredItem,
  RequiredItemField,
} from "@/components/molecules/event-post/RequiredItemField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/services/apiClient";

// イベント投稿フォームの入力状態を管理する型定義
type EventPostFormState = {
  eventName: string; // イベント名
  eventContent: string; // イベント内容
  eventImage: File | null; // イベント画像ファイル
  eventDocuments: File[]; // イベント資料ファイルの配列
  location: string; // 開催場所
  eventDateTime: string; // 開催日時
  feeCategoryGroups: PriceCategory[]; // 参加費用のカテゴリと金額の配列
  capacity: string; // 定員数
  applicationUrlEnabled: boolean; // 申し込みURLの有効化状態
  applicationUrl: string; // 申し込みURL
  requiredItems: RequiredItem[]; // 持ち物の配列
};

// イベント投稿フォームの入力エラーを管理する型定義
type EventPostFormErrors = {
  eventName?: string;
  eventContent?: string;
  location?: string;
  eventDateTime?: string;
  feeCategoryGroups?: Record<number, string>;
  capacity?: string;
  applicationUrl?: string;
  requiredItems?: Record<number, string>;
};

const MAX_TEXT_LENGTH = 255;

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
  location: "",
  eventDateTime: "",
  feeCategoryGroups: [{ category: "一般", amount: "0" }],
  capacity: "",
  applicationUrlEnabled: false,
  applicationUrl: "",
  requiredItems: [],
};

// イベント投稿ページコンポーネント
export default function EventPostPage() {
  const formId = useId(); // フォームの一意なIDを生成
  const router = useRouter(); // Next.jsのルーターを取得
  const [formState, setFormState] = useState<EventPostFormState>(INITIAL_STATE); // フォームの状態を管理するステート
  const [errors, setErrors] = useState<EventPostFormErrors>({}); // フォームのエラー状態を管理するステート
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth(); // 認証状態を取得するカスタムフックを使用

  // 認証状態がロードされ、かつ未認証の場合はサインインページにリダイレクト
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(ROUTES.SIGNIN);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const getFieldId = (suffix: string) => `${formId}-${suffix}`; // フィールドのIDを生成する関数

  // 入力値の正規化関数（全角数字を半角に変換し、数字以外を除去）
  const normalizeHalfWidthDigits = (value: string) =>
    value
      .replace(/[０-９]/g, (character) =>
        String.fromCharCode(character.charCodeAt(0) - 0xfee0),
      )
      .replace(/[^0-9]/g, "");

  // 日付の年部分を4桁に制限する関数（YYYY-MM-DD形式を想定）
  const clampDateYear = (value: string) => {
    const [yearPart, ...rest] = value.split("-");
    if (!yearPart) {
      return value;
    }

    const normalizedYear = normalizeHalfWidthDigits(yearPart).slice(0, 4);
    return [normalizedYear, ...rest].join("-");
  };

  // フォームの特定のフィールドの値を更新する関数
  const setField = <K extends keyof EventPostFormState>(
    key: K,
    value: EventPostFormState[K],
  ) => {
    // フォームの状態を更新
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // 画像アップロードの仮バックエンド連携。
  // 実装時は、選択された画像を Storage API に送信し、返却された image_objectkey を event_images に保存する。
  const uploadEventImage = async (file: File | null) => {
    if (!file) {
      return null;
    }

    // TODO:
    // - FormData を作成して画像を送信する
    // - API のレスポンスから image_objectkey を受け取る
    // - 必要であれば公開 URL も受け取る
    // - 失敗したら例外を投げて submit を止める
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    return `mock-image-objectkey-${file.name}`;
  };

  // PDF アップロードの仮バックエンド連携。
  // 実装時は、選択された PDF を順番に送信し、返却された pdf_objectkey を event_pdfs に保存する。
  const uploadEventDocuments = async (files: File[]) => {
    if (files.length === 0) {
      return [];
    }

    // TODO:
    // - 各 PDF を API / Storage に送信する
    // - API のレスポンスから pdf_objectkey を受け取る
    // - event_id が確定した後に event_pdfs へ保存する
    // - 1 件でも失敗したら例外を投げて submit を止める
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    return files.map((file) => `mock-pdf-objectkey-${file.name}`);
  };

  // イベント本体を作成する仮バックエンド連携。
  // 実装時は、ここで events テーブルを作成し、imageObjectKeys / pdfObjectKeys を紐付ける。
  const createEventPost = async (payload: {
    eventName: string;
    eventContent: string;
    eventDateTime: string;
    location: string;
    feeCategoryGroups: PriceCategory[];
    capacity: string;
    applicationUrlEnabled: boolean;
    applicationUrl: string;
    imageObjectKeys: string[];
    pdfObjectKeys: string[];
    requiredItems: RequiredItem[];
  }) => {
    const response = await apiFetch("/api/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `イベント作成に失敗しました (Status: ${response.status})`,
      );
    }
  };

  // イベント資料の特定のファイルを削除する関数
  const removeEventDocument = (index: number) => {
    setField(
      "eventDocuments",
      formState.eventDocuments.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    );
  };

  // フォームの入力値を検証する関数
  const validate = () => {
    const nextErrors: EventPostFormErrors = {};

    // 必須項目の検証
    if (!formState.eventName.trim()) {
      nextErrors.eventName = "イベント名は必須です。";
    } else if (formState.eventName.trim().length > MAX_TEXT_LENGTH) {
      nextErrors.eventName = "イベント名は255文字以内で入力してください。";
    }

    // 必須項目の検証
    if (!formState.eventContent.trim()) {
      nextErrors.eventContent = "イベント内容は必須です。";
    }

    // 必須項目の検証
    if (!formState.location.trim()) {
      nextErrors.location = "開催場所は必須です。";
    } else if (formState.location.trim().length > MAX_TEXT_LENGTH) {
      nextErrors.location = "開催場所は255文字以内で入力してください。";
    }

    // 必須項目の検証
    if (!formState.eventDateTime.trim()) {
      nextErrors.eventDateTime = "開催日時は必須です。";
    } else if (!isValidLocalDateTime(formState.eventDateTime.trim())) {
      nextErrors.eventDateTime = "開催日時の形式が正しくありません。";
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
        feeErrors[index] = "カテゴリと金額を入力してください。";
      } else if (!hasCategory) {
        feeErrors[index] = "カテゴリを入力してください。";
      } else if (!hasAmount) {
        feeErrors[index] = "金額を入力してください。";
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
        requiredItemErrors[index] = "持ち物名を入力してください。";
      } else if (item.itemName.trim().length > MAX_TEXT_LENGTH) {
        requiredItemErrors[index] = "持ち物名は255文字以内で入力してください。";
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
      // 定員数が空でない場合、0以上の整数であることを確認
      nextErrors.capacity = "定員数は0以上の整数で入力してください。";
    }

    // 申し込みURLの検証（有効化されている場合、正しいURL形式であるか）
    if (formState.applicationUrlEnabled && formState.applicationUrl.trim()) {
      if (formState.applicationUrl.trim().length > MAX_TEXT_LENGTH) {
        nextErrors.applicationUrl =
          "申し込みURLは255文字以内で入力してください。";
      }

      // URLの形式を検証するために、try-catchでURLオブジェクトを生成
      if (!nextErrors.applicationUrl) {
        try {
          const parsedUrl = new URL(formState.applicationUrl.trim());
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

    return nextErrors;
  };

  // フォームの送信イベントハンドラー
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 入力値の検証を行い、エラーがあればエラー状態を更新
    const nextErrors = validate();
    setErrors(nextErrors);

    // エラーが存在する場合、送信処理を中断
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      // 仮の送信フロー:
      // 1. 画像と PDF を先にアップロードする
      // 2. 返却された objectkey をイベント作成 API に渡す
      // 3. events / event_images / event_pdfs を順に保存する想定
      const imageObjectKey = await uploadEventImage(formState.eventImage);
      const pdfObjectKeys = await uploadEventDocuments(
        formState.eventDocuments,
      );
      await createEventPost({
        eventName: formState.eventName,
        eventContent: formState.eventContent,
        eventDateTime: toRfc3339(formState.eventDateTime),
        location: formState.location,
        feeCategoryGroups: formState.feeCategoryGroups,
        capacity: formState.capacity,
        applicationUrlEnabled: formState.applicationUrlEnabled,
        applicationUrl: formState.applicationUrl,
        imageObjectKeys: imageObjectKey ? [imageObjectKey] : [],
        pdfObjectKeys,
        requiredItems: formState.requiredItems,
      });

      toast.success("イベント情報を登録しました。");
      router.push(ROUTES.EVENT_LIST);
    } catch (error) {
      console.error("イベント情報の登録に失敗しました。", error);
      toast.error(
        "イベント情報の登録に失敗しました。時間をおいて再度お試しください。",
      );
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="grid gap-6">
        <Card className="border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur">
          <CardHeader className="space-y-5 border-b border-slate-200/80 bg-linear-to-br from-teal-50 via-white to-emerald-50 pb-6">
            <SectionHeading
              eyebrow="Event Entry"
              title="イベント基本情報"
              description="まずは必須項目を整え、次に画像やPDF、申込導線を追加します。"
              icon={<Megaphone className="h-4 w-4" />}
            />
            <CardDescription className="text-sm text-slate-600">
              必須項目はイベント名、イベント内容、開催場所、開催日時、参加費用です。
            </CardDescription>
          </CardHeader>

          {/* フォームの送信イベントをhandleSubmitにバインド */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <CardContent className="space-y-8 pt-6">
              <div className="grid gap-6">
                {/* イベントの基本情報入力セクション */}
                <SectionHeading
                  eyebrow="Basic Info"
                  title="イベントの骨格を入力"
                  description="ここで入力した内容がイベントページの中心情報になります。"
                  icon={<Sparkles className="h-4 w-4" />}
                />

                {/* イベント名の入力フィールド */}
                <FormField
                  id={getFieldId("eventName")}
                  label="イベント名"
                  required
                  hint="閲覧者が一覧で最初に目にする項目です。"
                  error={errors.eventName}
                >
                  <Input
                    id={getFieldId("eventName")}
                    maxLength={MAX_TEXT_LENGTH}
                    value={formState.eventName}
                    onChange={(event) =>
                      setField("eventName", event.target.value)
                    }
                    placeholder="例: 里山観察ワークショップ"
                    aria-invalid={Boolean(errors.eventName)}
                  />
                </FormField>

                {/* イベント画像のアップロードフィールド */}
                {/*
                  TODO: event_images のバックエンド連携をここに追加する。
                  入れるコードの例:
                  - 画像ファイルを Storage API に送信する
                  - 返却された image_objectkey を保持する
                  - events 作成 API に image_objectkey を渡す
                  - 失敗時は submit を止めてエラー表示する
                */}
                <FileField
                  id={getFieldId("eventImage")}
                  label="イベント画像"
                  accept="image/*"
                  hint="サムネイルや告知バナーとして使う画像です。"
                  selectedFile={formState.eventImage}
                  onSelectedFileChange={(file) => setField("eventImage", file)}
                />
              </div>

              {/* イベント資料のアップロードセクション */}
              <div className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-100">
                <SectionHeading
                  eyebrow="PDF Upload"
                  title="イベント資料をアップロード"
                  description="最大3つまでのPDFファイルを選択できます。"
                  icon={<FileText className="h-4 w-4" />}
                />

                {/*
                  TODO: event_pdfs のバックエンド連携をここに追加する。
                  入れるコードの例:
                  - PDF ファイルを Storage API に順番に送信する
                  - 返却された pdf_objectkey を配列で保持する
                  - event_pdfs テーブルに event_id と pdf_objectkey を保存する
                  - 1 件でも失敗したら submit を中断する
                */}
                <div className="space-y-2">
                  <Label
                    htmlFor={getFieldId("eventDocuments")}
                    className="text-sm font-semibold text-slate-800"
                  >
                    イベント資料
                  </Label>
                  <Input
                    id={getFieldId("eventDocuments")}
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={(event) => {
                      const newFiles = Array.from(event.target.files ?? []);
                      const combined = [
                        ...formState.eventDocuments,
                        ...newFiles,
                      ].slice(0, 3);
                      setField("eventDocuments", combined);
                    }}
                    className="cursor-pointer"
                  />

                  {/* アップロードされたPDFファイルのリスト表示 */}
                  <div className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {formState.eventDocuments.length > 0 ? (
                      <ul className="space-y-1">
                        {formState.eventDocuments.map((file, idx) => (
                          <li
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {idx + 1}. {file.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeEventDocument(idx)}
                              className="shrink-0 cursor-pointer text-red-600 hover:bg-transparent hover:text-red-700"
                              aria-label={`${file.name} を削除`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>未選択</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    企画書、ポスター、参加案内資料など、イベント関連のPDFをまとめてアップロードできます。
                  </p>
                </div>
              </div>

              {/* 開催条件の入力セクション */}
              <div className="grid gap-6">
                <SectionHeading
                  eyebrow="Event Details"
                  title="開催条件を整理"
                  description="場所、日時、費用、必要物、定員をまとめて管理します。"
                  icon={<MapPinned className="h-4 w-4" />}
                />

                {/* 開催場所の入力フィールド */}
                <FormField
                  id={getFieldId("location")}
                  label="開催場所"
                  required
                  hint="住所や施設名、集合場所をわかりやすく記載してください。"
                  error={errors.location}
                >
                  <Input
                    id={getFieldId("location")}
                    maxLength={MAX_TEXT_LENGTH}
                    value={formState.location}
                    onChange={(event) =>
                      setField("location", event.target.value)
                    }
                    placeholder="例: 〇〇市民ホール 2F 会議室A"
                    aria-invalid={Boolean(errors.location)}
                  />
                </FormField>

                {/* 開催日時の入力フィールド */}
                <FormField
                  id={getFieldId("eventDateTime")}
                  label="開催日時"
                  required
                  hint="開始予定日時を入力してください。"
                  error={errors.eventDateTime}
                >
                  <Input
                    id={getFieldId("eventDateTime")}
                    type="datetime-local"
                    value={formState.eventDateTime}
                    onChange={(event) =>
                      setField(
                        "eventDateTime",
                        clampDateYear(event.target.value),
                      )
                    }
                    aria-invalid={Boolean(errors.eventDateTime)}
                  />
                </FormField>

                {/* 参加費用と定員数の入力フィールドをグリッドでまとめる */}
                <div className="grid gap-6">
                  <FormField
                    id={getFieldId("feeCategoryGroups")}
                    label="参加費用"
                    required
                    hint="カテゴリと金額をセットで入力します。"
                    error={
                      Object.keys(errors.feeCategoryGroups ?? {}).length > 0
                        ? "参加費用の入力内容を確認してください。"
                        : undefined
                    }
                  >
                    {/* 参加費用のカテゴリと金額を入力するカスタムコンポーネント */}
                    <PriceCategoryField
                      items={formState.feeCategoryGroups}
                      onItemsChange={(items) =>
                        setField("feeCategoryGroups", items)
                      }
                      errors={errors.feeCategoryGroups}
                    />
                  </FormField>

                  {/* 定員数の入力フィールド */}
                  <FormField
                    id={getFieldId("capacity")}
                    label="定員数"
                    error={errors.capacity}
                  >
                    <Input
                      id={getFieldId("capacity")}
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
                </div>

                {/* 持ち物の入力フィールド */}
                <FormField
                  id={getFieldId("requiredItems")}
                  label="持ち物"
                  hint="持ち物名と必須判定をセットで管理します。"
                  error={
                    Object.keys(errors.requiredItems ?? {}).length > 0
                      ? "持ち物の入力内容を確認してください。"
                      : undefined
                  }
                >
                  <RequiredItemField
                    items={formState.requiredItems}
                    onItemsChange={(items) => setField("requiredItems", items)}
                    errors={errors.requiredItems}
                  />
                </FormField>
              </div>

              {/* 申し込みURLの入力セクション */}
              <OptionalUrlField
                id={getFieldId("applicationUrl")}
                toggleId={getFieldId("applicationUrlEnabled")}
                enabled={formState.applicationUrlEnabled}
                url={formState.applicationUrl}
                error={errors.applicationUrl}
                onEnabledChange={(enabled) =>
                  setField("applicationUrlEnabled", enabled)
                }
                onUrlChange={(url) => setField("applicationUrl", url)}
              />

              {/* イベント内容の入力フィールド */}
              <FormField
                id={getFieldId("eventContent")}
                label="イベント内容"
                required
                hint="イベントの目的、参加対象、当日の流れなどを記載します。"
                error={errors.eventContent}
              >
                <Textarea
                  id={getFieldId("eventContent")}
                  rows={8}
                  className="max-h-60 resize-y overflow-y-auto"
                  value={formState.eventContent}
                  onChange={(event) =>
                    setField("eventContent", event.target.value)
                  }
                  placeholder="イベントの概要や参加者への案内を入力してください。"
                  aria-invalid={Boolean(errors.eventContent)}
                />
              </FormField>
            </CardContent>

            {/* フォームの送信ボタンと注意書きを含むフッター */}
            <CardFooter className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-slate-600">
                <p>公開前に必須項目の入力内容を確認してください。</p>
              </div>
              <EventPostSubmitButton type="submit">
                イベント情報を登録
              </EventPostSubmitButton>
            </CardFooter>
          </form>
        </Card>
      </div>
    </section>
  );
}
