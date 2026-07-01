import { Trash2 } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// 複数画像選択フィールドコンポーネントのプロパティを定義
type MultiFileFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  accept?: string;
  selectedFiles: FileWithId[];
  onSelectedFilesChange: (files: FileWithId[]) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
};

// ファイルに一意のIDを追加するための型
export type FileWithId = File & { id: string };

// 複数画像選択フィールドコンポーネント
export function MultiFileField({
  id,
  label,
  hint,
  error,
  accept,
  selectedFiles,
  onSelectedFilesChange,
  maxFiles = 10,
  className,
  disabled = false,
}: Readonly<MultiFileFieldProps>) {
  const isImage = accept?.startsWith("image/"); // 受け入れるファイルタイプが画像かどうかを判定するフラグ
  const canAddMore = selectedFiles.length < maxFiles; // さらにファイルを追加できるかどうかを判定

  // file.id -> プレビュー用のBlob URLを保持するマップ
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  // アンマウント時のcleanupで最新のpreviewUrlsを参照するためのref
  const previewUrlsRef = useRef<Record<string, string>>({});

  // selectedFiles の増減に応じて、プレビューURLを生成・破棄する
  useEffect(() => {
    if (!isImage) return;

    setPreviewUrls((prev) => {
      const next: Record<string, string> = {};

      // 既存ファイルのURLは再利用し、新規ファイルのみ生成する
      for (const file of selectedFiles) {
        next[file.id] = prev[file.id] ?? URL.createObjectURL(file);
      }

      // 配列からなくなったファイルのURLは解放する
      for (const fileId of Object.keys(prev)) {
        if (!(fileId in next)) {
          URL.revokeObjectURL(prev[fileId]);
        }
      }

      previewUrlsRef.current = next;
      return next;
    });
  }, [selectedFiles, isImage]);

  // コンポーネント自体がアンマウントされる際に、残っているURLをすべて解放する
  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrlsRef.current)) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  // ファイルが選択されたときの処理
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const newFiles = files.map((file) => {
      const fileWithId = file as FileWithId;
      fileWithId.id = crypto.randomUUID();
      return fileWithId;
    });

    onSelectedFilesChange([...selectedFiles, ...newFiles]);
    event.target.value = "";
  };

  // ファイルを削除する処理
  const handleRemoveFile = (id: string) => {
    onSelectedFilesChange(selectedFiles.filter((file) => file.id !== id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </Label>
        {selectedFiles.length > 0 && maxFiles && (
          <span className="text-xs text-slate-500">
            {selectedFiles.length} / {maxFiles}
          </span>
        )}
      </div>

      {hint && <FieldNote>{hint}</FieldNote>}

      {/* ファイル追加ボタン */}
      {canAddMore && (
        <div className="relative w-full cursor-pointer">
          <label
            htmlFor={id}
            className={cn(
              "flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed bg-white text-sm font-medium text-slate-700 shadow-sm transition duration-150",
              disabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-300 hover:border-slate-400",
            )}
          >
            ファイルを選択
          </label>
          <Input
            id={id}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileChange}
            disabled={!canAddMore || disabled}
            title=""
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      )}

      {/* 選択されたファイルの一覧 */}
      {selectedFiles.length > 0 && (
        <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              {isImage ? (
                <div className="relative aspect-square">
                  {previewUrls[file.id] && (
                    <Image
                      src={previewUrls[file.id]}
                      alt={file.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-slate-100 p-2">
                  <span className="text-center text-xs font-medium text-slate-600">
                    {file.name}
                  </span>
                </div>
              )}

              {/* 削除ボタン */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemoveFile(file.id)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700"
                aria-label="削除"
                disabled={disabled}
              >
                <Trash2 className="h-3 w-3 text-white" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!canAddMore && (
        <FieldNote tone="error">
          最大{maxFiles}個までアップロードできます
        </FieldNote>
      )}

      {error && <FieldNote tone="error">{error}</FieldNote>}
    </div>
  );
}
