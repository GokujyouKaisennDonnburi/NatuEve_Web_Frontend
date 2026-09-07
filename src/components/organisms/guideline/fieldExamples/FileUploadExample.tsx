"use client";

import { useState } from "react";

import { FormCard } from "@/components/molecules/FormCard";
import { FileDropZone } from "@/components/molecules/FileDropZone";
import { MAX_EVENT_PDF_COUNT } from "@/constants/config";
import {
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  validateUploadFile,
} from "@/utils/upload";

type FileUploadExampleProps = {
  variant: "image" | "pdf";
  idPrefix: string;
};

const toMegabytes = (bytes: number) => Math.floor(bytes / (1024 * 1024));

// 実フォームの「イベント画像／イベント資料」ブロックと同じ構成の見本。
// 選択したファイルはローカル状態に反映されるが、アップロード処理につながらないためどこにも送信されない。
// 3.10（画像）と 3.11（資料）で同じ見本を掲載するため、idPrefix で id の衝突を避ける。
export function FileUploadExample({
  variant,
  idPrefix,
}: Readonly<FileUploadExampleProps>) {
  const [files, setFiles] = useState<File[]>([]);

  if (variant === "image") {
    return (
      <div className="my-5">
        <FormCard
          title="イベント画像"
          description={
            "詳細ページの先頭に表示されます。\nJPG / PNG を1つ選択できます。"
          }
        >
          <FileDropZone
            id={`${idPrefix}-event-image`}
            accept="image/jpeg,image/png"
            files={files}
            onFilesChange={setFiles}
            promptLabel="クリックまたはドラッグで画像をアップロード"
            hint={`1ファイル ${toMegabytes(MAX_IMAGE_BYTES)}MB まで`}
            validate={(file) => validateUploadFile(file, "image")}
          />
        </FormCard>
      </div>
    );
  }

  return (
    <div className="my-5">
      <FormCard
        title="イベント資料"
        description={`しおり、アクセスマップ、同意書など、まとめてアップロードできます。\n最大${MAX_EVENT_PDF_COUNT}つまでのPDFファイルを選択できます。`}
      >
        <FileDropZone
          id={`${idPrefix}-event-documents`}
          accept="application/pdf"
          files={files}
          onFilesChange={setFiles}
          maxFiles={MAX_EVENT_PDF_COUNT}
          promptLabel="クリックまたはドラッグでPDFをアップロード"
          hint={`1ファイル ${toMegabytes(MAX_PDF_BYTES)}MB まで`}
          validate={(file) => validateUploadFile(file, "pdf")}
        />
      </FormCard>
    </div>
  );
}
