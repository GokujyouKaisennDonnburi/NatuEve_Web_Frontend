"use client";

import { FieldNote } from "@/components/atoms/FieldNote";
import { OptionalUrlField } from "@/components/molecules/event-post/OptionalUrlField";
import { FileDropZone } from "@/components/molecules/FileDropZone";
import { FormCard } from "@/components/molecules/FormCard";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { validateUploadFile } from "@/utils/upload";
import type React from "react";

export type ReportPostFormState = {
  content: string;
  reportImages: File[];
  externalUrlEnabled: boolean;
  externalUrl: string;
  reportPdfs: File[];
};

type ReportPostFormProps = {
  formState: ReportPostFormState;
  validationErrors: Record<string, string>;
  setFormState: React.Dispatch<React.SetStateAction<ReportPostFormState>>;
};

export function ReportPostForm({
  formState,
  validationErrors,
  setFormState,
}: Readonly<ReportPostFormProps>) {
  return (
    <div className="space-y-4">
      {/* レポート内容 */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <h2 className="text-lg font-bold text-slate-900">レポート内容</h2>

          <CardDescription>
            当日の様子を参加者・閲覧者に伝えましょう。外部サイトに掲載済みの場合は、そのURLだけでも公開できます。
          </CardDescription>

          {/* 外部URL */}
          <div className="my-4">
            <OptionalUrlField
              id="external-url"
              toggleId="external-url-toggle"
              enabled={formState.externalUrlEnabled}
              onEnabledChange={(enabled) =>
                setFormState((prev) => ({
                  ...prev,
                  externalUrlEnabled: enabled,
                  ...(enabled && {
                    content: "",
                    reportImages: [],
                    reportPdfs: [],
                  }),
                }))
              }
              url={formState.externalUrl}
              onUrlChange={(url) =>
                setFormState((prev) => ({
                  ...prev,
                  externalUrl: url,
                }))
              }
              error={validationErrors.externalUrl}
            />
          </div>

          {!formState.externalUrlEnabled && (
            <div className="space-y-2">
              {/* 活動記録テキスト */}
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-slate-800"
              >
                活動した記録 <span className="text-slate-600">*</span>
              </label>

              <FieldNote>
                当日の様子、観察できたもの、参加者の反応などを記入してください。
              </FieldNote>

              <Textarea
                id="content"
                placeholder="例：当日は快晴に恵まれ、21組48名の方にご参加いただきました。木道沿いで例年より多くのヘイケボタルを観察でき、参加された親子からは歓声が上がっていました。水質調査の結果、今年も湿原の水環境が良好に保たれていることが確認できました。"
                value={formState.content}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                className="min-h-32 resize-none border-[#CDD4C8]"
              />

              {validationErrors.content && (
                <FieldNote tone="error">{validationErrors.content}</FieldNote>
              )}

              <FieldNote>{formState.content.length} / 2000文字</FieldNote>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 画像セクション */}
      {!formState.externalUrlEnabled && (
        <FormCard
          title="活動している画像"
          description={"JPG / PNG ・ 最大10枚まで選択出来ます。"}
        >
          <FileDropZone
            id="report-images"
            accept="image/jpeg,image/png"
            files={formState.reportImages}
            onFilesChange={(files) =>
              setFormState((prev) => ({
                ...prev,
                reportImages: files,
              }))
            }
            maxFiles={10}
            promptLabel="クリックまたはドラッグで画像をアップロード"
            hint="JPG / PNG ・ 1ファイル 10MB まで"
            validate={(file) => validateUploadFile(file, "image")}
          />
        </FormCard>
      )}

      {/* PDFセクション */}
      {!formState.externalUrlEnabled && (
        <FormCard
          title="資料PDF"
          description={"調査結果、配布資料など ・ 最大3つまで選択できます。"}
        >
          <FileDropZone
            id="report-pdfs"
            accept="application/pdf"
            files={formState.reportPdfs}
            onFilesChange={(files) =>
              setFormState((prev) => ({
                ...prev,
                reportPdfs: files,
              }))
            }
            maxFiles={3}
            promptLabel="クリックまたはドラッグでPDFをアップロード"
            hint="1ファイル 10MB まで"
            validate={(file) => validateUploadFile(file, "pdf")}
          />
        </FormCard>
      )}
    </div>
  );
}
