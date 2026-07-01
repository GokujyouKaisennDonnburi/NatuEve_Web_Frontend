"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

type InlineTextareaFieldProps = {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  isEditable?: boolean;
  className?: string;
  textClassName?: string;
};

export function InlineTextareaField({
  value: initialValue,
  onSave,
  placeholder,
  isEditable = false,
  className = "",
  textClassName = "",
}: InlineTextareaFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) setValue(initialValue);
  }, [initialValue, isEditing]);
  const handleSave = async () => {
    // 変更がない場合は何もしない（閉じるだけ）
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(value);
      setIsEditing(false);
    } catch (error) {
      console.error("保存に失敗しました", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          placeholder={placeholder}
          className="h-32 resize-none overflow-y-auto"
          autoFocus
        />
        <div className="flex justify-end gap-1">
          {/* 変更がなくても押せるように統一 */}
          <Button
            type="button"
            aria-label="保存する"
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            aria-label="キャンセルする"
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 w-8 text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!initialValue && isEditable) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" /> 自己紹介を追加する
      </button>
    );
  }

  return (
    <div className={`group relative pr-8 ${className}`}>
      <div className="max-h-32 overflow-y-auto pr-2">
        <p className={`whitespace-pre-wrap break-words ${!initialValue ? "text-slate-400" : ""} ${textClassName}`}>
          {initialValue || "自己紹介がまだ設定されていません。"}
        </p>
      </div>
      {isEditable && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute -top-2 -right-2 h-8 w-8 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => setIsEditing(true)}
          aria-label="編集する"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
