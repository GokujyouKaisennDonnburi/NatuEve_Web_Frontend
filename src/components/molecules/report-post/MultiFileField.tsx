import { Trash2 } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { FieldNote } from "@/components/atoms/FieldNote";
import { FormEmptyBox } from "@/components/atoms/FormEmptyBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatFileNames } from "@/utils/upload";

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
  // 選択されたファイルを検証する。エラーメッセージを返すと、そのファイルは追加されない
  validate?: (file: File) => string | null;
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
  validate,
}: Readonly<MultiFileFieldProps>) {
  const isImage = accept?.startsWith("image/"); // 受け入れるファイルタイプが画像かどうかを判定するフラグ
  const canAddMore = selectedFiles.length < maxFiles; // さらにファイルを追加できるかどうかを判定
  const errorId = useId();

  // file.id -> プレビュー用のBlob URLを保持するマップ
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  // アンマウント時のcleanupで最新のpreviewUrlsを参照するためのref
  const previewUrlsRef = useRef<Record<string, string>>({});
  // 追加できなかったファイルの理由を伝えるメッセージ（検証エラー / 上限超過）
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  // selectedFiles の増減に応じて、プレビューURLを生成・破棄する
  // 再利用は state ではなく ref を基準に行う。ref はアンマウント時に空になるため、
  // 入力⇔プレビュー切替で再マウントされた際に revoke 済みURLを使い回さない。
  useEffect(() => {
    if (!isImage) return;

    const current = previewUrlsRef.current;
    const next: Record<string, string> = {};

    // 前回保持していたURLは再利用し、新規ファイルのみ生成する
    for (const file of selectedFiles) {
      next[file.id] = current[file.id] ?? URL.createObjectURL(file);
    }

    // 配列からなくなったファイルのURLは解放する
    for (const fileId of Object.keys(current)) {
      if (!(fileId in next)) {
        URL.revokeObjectURL(current[fileId]);
      }
    }

    previewUrlsRef.current = next;
    setPreviewUrls(next);
  }, [selectedFiles, isImage]);

  // コンポーネント自体がアンマウントされる際に、残っているURLをすべて解放する
  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrlsRef.current)) {
        URL.revokeObjectURL(url);
      }
      // 解放済みURLを再マウント後に使い回さないよう、参照ごと空にする
      previewUrlsRef.current = {};
    };
  }, []);

  // ファイルが選択されたときの処理
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 同じファイルを選び直せるように入力値をリセットする
    event.target.value = "";
    if (disabled || files.length === 0) return;

    // 選択された時点で検証し、通らないものはフォームへ渡さない。
    // 理由は欄の下に赤字で出し、最初の1件だけを表示する。
    const accepted: File[] = [];
    let message: string | null = null;
    for (const file of files) {
      const validationError = validate?.(file) ?? null;
      if (validationError) {
        message ??= validationError;
        continue;
      }
      accepted.push(file);
    }

    // 上限を超えた分は黙って落とさず、どれが入らなかったかを名前で伝える
    const capacity = Math.max(0, maxFiles - selectedFiles.length);
    const added = accepted.slice(0, capacity);
    const overflowed = accepted.slice(capacity);

    if (!message && overflowed.length > 0) {
      const limitText =
        maxFiles === 1 ? "1つだけ選べます" : `最大${maxFiles}個までです`;
      message = `${limitText}。${formatFileNames(overflowed)}は追加していません。`;
    }

    setRejectionMessage(message);

    // 1件も追加できないときは親へ通知しない
    if (added.length === 0) {
      return;
    }

    const newFiles = added.map((file) => {
      const fileWithId = file as FileWithId;
      fileWithId.id = crypto.randomUUID();
      return fileWithId;
    });

    onSelectedFilesChange([...selectedFiles, ...newFiles]);
  };

  // ファイルを削除する処理
  const handleRemoveFile = (id: string) => {
    setRejectionMessage(null);
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

      {/* ファイル追加ボタン。上限に達したら代わりに「削除してほしい」旨の枠を表示する */}
      {canAddMore ? (
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
            aria-describedby={rejectionMessage ? errorId : undefined}
            title=""
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      ) : (
        <FormEmptyBox>
          {maxFiles === 1
            ? "変更するには、下の一覧から削除してください。"
            : "追加するには、下の一覧から削除してください。"}
        </FormEmptyBox>
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
                      // Blob URL は Next.js の画像最適化を通せないため、そのまま表示する
                      unoptimized
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

      {rejectionMessage && (
        <FieldNote tone="error">
          <span id={errorId}>{rejectionMessage}</span>
        </FieldNote>
      )}

      {error && <FieldNote tone="error">{error}</FieldNote>}
    </div>
  );
}
