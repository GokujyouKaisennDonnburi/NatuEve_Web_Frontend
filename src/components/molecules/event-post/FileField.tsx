import { X } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useState } from "react";

import { FieldNote } from "@/components/atoms/event-post/FieldNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ファイル選択フィールドコンポーネントのプロパティを定義
type FileFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  accept?: string;
  selectedFile: File | null;
  onSelectedFileChange: (file: File | null) => void;
  className?: string;
};

// ファイル選択フィールドコンポーネント
export function FileField({
  id,
  label,
  hint,
  error,
  accept,
  selectedFile,
  onSelectedFileChange,
  className,
}: Readonly<FileFieldProps>) {
  const [preview, setPreview] = useState<string | null>(null); // 選択されたファイルのプレビューURLを管理する状態
  const [inputKey, setInputKey] = useState(0); // ファイル入力のリセットのために使用するキーを管理する状態
  const isImage = accept?.startsWith("image/"); // 受け入れるファイルタイプが画像かどうかを判定するフラグ

  // ファイルが選択されたときの処理
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onSelectedFileChange(file);

    // 選択されたファイルが画像の場合はプレビューを生成する
    if (file && isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // ファイル選択をクリアする処理
  const handleClear = () => {
    onSelectedFileChange(null);
    setPreview(null);
    setInputKey((current) => current + 1);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </Label>
      </div>

      {/* ファイル入力フィールドと選択されたファイルのプレビューを表示する部分 */}
      <div className="relative">
        <Input
          key={inputKey}
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="cursor-pointer pr-11"
        />
        {selectedFile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-red-600 hover:bg-transparent hover:text-red-700"
            aria-label="選択を解除"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* 選択されたファイルのプレビューを表示する部分 */}
      {preview && isImage ? (
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100">
          <Image
            src={preview}
            alt="Selected preview"
            width={200}
            height={128}
            className="h-24 w-full object-contain bg-slate-50"
          />
          <p className="px-3 py-2 text-xs text-slate-600">
            {selectedFile?.name}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {selectedFile ? selectedFile.name : "未選択"}
        </div>
      )}

      {hint ? <FieldNote>{hint}</FieldNote> : null}
      {error ? <FieldNote tone="error">{error}</FieldNote> : null}
    </div>
  );
}
