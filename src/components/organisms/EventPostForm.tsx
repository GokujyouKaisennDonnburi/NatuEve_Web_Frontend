"use client";

import { FileText, MapPinned, Megaphone, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
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

type EventPostFormState = {
  eventName: string;
  eventContent: string;
  eventImage: File | null;
  eventDocuments: File[];
  location: string;
  eventDateTime: string;
  feeCategoryGroups: PriceCategory[];
  requiredItems: string;
  capacity: string;
  applicationUrlEnabled: boolean;
  applicationUrl: string;
};

type EventPostFormErrors = {
  eventName?: string;
  eventContent?: string;
  location?: string;
  eventDateTime?: string;
  feeCategoryGroups?: Record<number, string>;
  capacity?: string;
  applicationUrl?: string;
};

const INITIAL_STATE: EventPostFormState = {
  eventName: "",
  eventContent: "",
  eventImage: null,
  eventDocuments: [],
  location: "",
  eventDateTime: "",
  feeCategoryGroups: [{ category: "一般", amount: "0" }],
  requiredItems: "",
  capacity: "",
  applicationUrlEnabled: false,
  applicationUrl: "",
};

export function EventPostForm() {
  const formId = useId();
  const router = useRouter();
  const [formState, setFormState] = useState<EventPostFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<EventPostFormErrors>({});

  const getFieldId = (suffix: string) => `${formId}-${suffix}`;

  const normalizeHalfWidthDigits = (value: string) =>
    value
      .replace(/[０-９]/g, (character) =>
        String.fromCharCode(character.charCodeAt(0) - 0xfee0),
      )
      .replace(/[^0-9]/g, "");

  const clampDateYear = (value: string) => {
    const [yearPart, ...rest] = value.split("-");
    if (!yearPart) {
      return value;
    }

    const normalizedYear = normalizeHalfWidthDigits(yearPart).slice(0, 4);
    return [normalizedYear, ...rest].join("-");
  };

  const setField = <K extends keyof EventPostFormState>(
    key: K,
    value: EventPostFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const removeEventDocument = (index: number) => {
    setField(
      "eventDocuments",
      formState.eventDocuments.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    );
  };

  const submitEventPost = async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });
  };

  const validate = () => {
    const nextErrors: EventPostFormErrors = {};

    if (!formState.eventName.trim()) {
      nextErrors.eventName = "イベント名は必須です。";
    }

    if (!formState.eventContent.trim()) {
      nextErrors.eventContent = "イベント内容は必須です。";
    }

    if (!formState.location.trim()) {
      nextErrors.location = "開催場所は必須です。";
    }

    if (!formState.eventDateTime.trim()) {
      nextErrors.eventDateTime = "開催日時は必須です。";
    }

    // 参加費用の検証（カテゴリと金額が揃っているか）
    const feeErrors: Record<number, string> = {};
    formState.feeCategoryGroups.forEach((group, index) => {
      if (!group.category.trim()) {
        feeErrors[index] = "カテゴリを入力してください。";
      }
      if (!group.amount.trim()) {
        feeErrors[index] = "金額を入力してください。";
      } else if (!/^\d+$/.test(group.amount.trim())) {
        feeErrors[index] = "金額は数字で入力してください。";
      }
    });
    if (Object.keys(feeErrors).length > 0) {
      nextErrors.feeCategoryGroups = feeErrors;
    }

    if (
      formState.capacity.trim() &&
      (!/^\d+$/.test(formState.capacity.trim()) ||
        Number(formState.capacity) <= 0)
    ) {
      nextErrors.capacity = "定員数は1以上の整数で入力してください。";
    }

    if (formState.applicationUrlEnabled && formState.applicationUrl.trim()) {
      try {
        new URL(formState.applicationUrl.trim());
      } catch {
        nextErrors.applicationUrl = "正しいURL形式で入力してください。";
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await submitEventPost();
    toast.success("イベント情報を登録しました。");
    router.push("/event-list");
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <CardContent className="space-y-8 pt-6">
              <div className="grid gap-6">
                <SectionHeading
                  eyebrow="Basic Info"
                  title="イベントの骨格を入力"
                  description="ここで入力した内容がイベントページの中心情報になります。"
                  icon={<Sparkles className="h-4 w-4" />}
                />

                <FormField
                  id={getFieldId("eventName")}
                  label="イベント名"
                  required
                  hint="閲覧者が一覧で最初に目にする項目です。"
                  error={errors.eventName}
                >
                  <Input
                    id={getFieldId("eventName")}
                    value={formState.eventName}
                    onChange={(event) =>
                      setField("eventName", event.target.value)
                    }
                    placeholder="例: 里山観察ワークショップ"
                    aria-invalid={Boolean(errors.eventName)}
                  />
                </FormField>

                <FormField
                  id={getFieldId("eventContent")}
                  label="イベント内容"
                  required
                  hint="イベントの目的、参加対象、当日の流れなどを記載します。"
                  error={errors.eventContent}
                >
                  <Textarea
                    id={getFieldId("eventContent")}
                    value={formState.eventContent}
                    onChange={(event) =>
                      setField("eventContent", event.target.value)
                    }
                    placeholder="イベントの概要や参加者への案内を入力してください。"
                    aria-invalid={Boolean(errors.eventContent)}
                  />
                </FormField>

                <FileField
                  id={getFieldId("eventImage")}
                  label="イベント画像"
                  accept="image/*"
                  hint="サムネイルや告知バナーとして使う画像です。"
                  selectedFile={formState.eventImage}
                  onSelectedFileChange={(file) => setField("eventImage", file)}
                />
              </div>

              <div className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm shadow-slate-100">
                <SectionHeading
                  eyebrow="PDF Upload"
                  title="イベント資料をアップロード"
                  description="最大3つまでのPDFファイルを選択できます。"
                  icon={<FileText className="h-4 w-4" />}
                />

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

              <div className="grid gap-6">
                <SectionHeading
                  eyebrow="Event Details"
                  title="開催条件を整理"
                  description="場所、日時、費用、必要物、定員をまとめて管理します。"
                  icon={<MapPinned className="h-4 w-4" />}
                />

                <FormField
                  id={getFieldId("location")}
                  label="開催場所"
                  required
                  hint="住所や施設名、集合場所をわかりやすく記載してください。"
                  error={errors.location}
                >
                  <Input
                    id={getFieldId("location")}
                    value={formState.location}
                    onChange={(event) =>
                      setField("location", event.target.value)
                    }
                    placeholder="例: 〇〇市民ホール 2F 会議室A"
                    aria-invalid={Boolean(errors.location)}
                  />
                </FormField>

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
                    <PriceCategoryField
                      items={formState.feeCategoryGroups}
                      onItemsChange={(items) =>
                        setField("feeCategoryGroups", items)
                      }
                      errors={errors.feeCategoryGroups}
                    />
                  </FormField>

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

                <FormField
                  id={getFieldId("requiredItems")}
                  label="必要物"
                  hint="持ち物や事前準備がある場合に入力してください。"
                >
                  <Textarea
                    id={getFieldId("requiredItems")}
                    value={formState.requiredItems}
                    onChange={(event) =>
                      setField("requiredItems", event.target.value)
                    }
                    placeholder="例: 飲み物、歩きやすい靴、帽子"
                  />
                </FormField>
              </div>

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
            </CardContent>

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
