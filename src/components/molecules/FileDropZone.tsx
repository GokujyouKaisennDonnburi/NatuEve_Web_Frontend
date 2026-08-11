"use client";

import { FileText, Upload } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { DeleteIconButton } from "@/components/atoms/DeleteIconButton";
import { FieldNote } from "@/components/atoms/FieldNote";
import { FormEmptyBox } from "@/components/atoms/FormEmptyBox";
import { cn } from "@/lib/utils";
import { formatFileNames } from "@/utils/upload";

type FileDropZoneProps = {
  id: string;
  accept: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  // クリック／ドロップ領域に表示する主文言
  promptLabel: string;
  // 主文言に添えるサイズ上限などの補足
  hint?: string;
  // 同時に保持できる件数。1 のときは選択のたびに置き換える
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  // 選択されたファイルを検証する。エラーメッセージを返すと、そのファイルは追加されない
  validate?: (file: File) => string | null;
};

// プレビュー用の Blob URL は File 単位で作り直すと無駄なため、
// File の同一性でひも付けて再利用する。
type FileEntry = {
  id: string;
  file: File;
  previewUrl: string | null;
};

// クリックとドラッグ&ドロップの両方でファイルを受け取る入力欄。
// 画像1枚・PDF複数のどちらにも使えるよう maxFiles で振る舞いを変える。
export function FileDropZone({
  id,
  accept,
  files,
  onFilesChange,
  promptLabel,
  hint,
  maxFiles = 1,
  disabled = false,
  className,
  validate,
}: Readonly<FileDropZoneProps>) {
  const isImage = accept.startsWith("image/");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const entriesRef = useRef<FileEntry[]>([]);
  const errorId = useId();

  useEffect(() => {
    const current = entriesRef.current;
    const next = files.map(
      (file) =>
        current.find((entry) => entry.file === file) ?? {
          id: crypto.randomUUID(),
          file,
          previewUrl: isImage ? URL.createObjectURL(file) : null,
        },
    );

    // 親が同じ内容の配列を作り直しただけのときは、更新せず再描画のループを止める
    const isUnchanged =
      next.length === current.length &&
      next.every((entry, index) => entry === current[index]);
    if (isUnchanged) {
      return;
    }

    for (const entry of current) {
      if (entry.previewUrl && !next.includes(entry)) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    }

    entriesRef.current = next;
    setEntries(next);
  }, [files, isImage]);

  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current) {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
      }
      // 解放済みの URL を再マウント後に使い回さないよう、参照ごと空にする
      entriesRef.current = [];
    };
  }, []);

  const canAddMore = files.length < maxFiles;

  // 上限が複数のときは、あと何件入れられるかを常に見せて超過を起きにくくする
  const remainingHint =
    maxFiles > 1 ? `あと${maxFiles - files.length}つ追加できます` : null;
  const hintText = [hint, remainingHint].filter(Boolean).join("・");

  const addFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) {
      return;
    }

    // 選択された時点で検証し、通らないものはフォームへ渡さない。
    // 理由は領域の下に赤字で出し、最初の1件だけを表示する。
    const accepted: File[] = [];
    let message: string | null = null;
    for (const file of incoming) {
      const validationError = validate?.(file) ?? null;
      if (validationError) {
        message ??= validationError;
        continue;
      }
      accepted.push(file);
    }

    // 1件しか持てない場合は「選び直し」として扱い、複数の場合は空き枠のぶんだけ追加する
    const capacity = maxFiles === 1 ? 1 : maxFiles - files.length;
    const added = accepted.slice(0, capacity);
    const overflowed = accepted.slice(capacity);

    // 入りきらなかったぶんは黙って落とさず、どれが入らなかったかを名前で伝える
    if (!message && overflowed.length > 0) {
      const limitText =
        maxFiles === 1 ? "1つだけ選べます" : `最大${maxFiles}個までです`;
      message = `${limitText}。${formatFileNames(overflowed)}は追加していません。`;
    }

    setRejectionMessage(message);

    // 1件も追加できないときは親へ通知しない。maxFiles が 1 のときに
    // 空配列を渡すと、選択済みの正しいファイルまで消えてしまうため。
    if (added.length === 0) {
      return;
    }

    onFilesChange(maxFiles === 1 ? added : [...files, ...added]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    // 同じファイルを選び直せるように入力値をリセットする
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const handleRemove = (targetId: string) => {
    setRejectionMessage(null);
    onFilesChange(
      entries
        .filter((entry) => entry.id !== targetId)
        .map((entry) => entry.file),
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* label より前に置くことで、キーボードフォーカスを peer で領域側に伝える */}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        disabled={disabled || !canAddMore}
        onChange={handleInputChange}
        className="peer sr-only"
        aria-invalid={Boolean(rejectionMessage)}
        aria-describedby={rejectionMessage ? errorId : undefined}
      />

      {canAddMore ? (
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) {
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition",
            "peer-focus-visible:border-(--brand-green) peer-focus-visible:ring-2 peer-focus-visible:ring-(--brand-green)/40",
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50"
              : "cursor-pointer border-slate-300 bg-white hover:border-(--brand-green) hover:bg-(--brand-green-soft)",
            isDragging && !disabled
              ? "border-(--brand-green) bg-(--brand-green-soft)"
              : "",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--brand-green-soft) text-(--brand-green-text)">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {promptLabel}
          </span>
          {hintText ? (
            <span className="text-xs text-slate-400">{hintText}</span>
          ) : null}
        </label>
      ) : (
        // 上限に達すると領域が消えるため、理由と次の操作が分かる枠を残す
        <FormEmptyBox>
          {maxFiles === 1
            ? "変更するには、下の一覧から削除してください。"
            : `追加するには、下の一覧から削除してください。`}
        </FormEmptyBox>
      )}

      {entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2"
            >
              {entry.previewUrl ? (
                <Image
                  src={entry.previewUrl}
                  alt=""
                  width={64}
                  height={64}
                  // Blob URL は Next.js の画像最適化を通せないため、そのまま表示する
                  unoptimized
                  className="h-16 w-16 shrink-0 rounded-lg bg-slate-50 object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <FileText className="h-6 w-6" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {entry.file.name}
              </span>
              <DeleteIconButton
                onClick={() => handleRemove(entry.id)}
                label={`${entry.file.name} を削除`}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {rejectionMessage ? (
        <FieldNote tone="error">
          <span id={errorId}>{rejectionMessage}</span>
        </FieldNote>
      ) : null}
    </div>
  );
}
