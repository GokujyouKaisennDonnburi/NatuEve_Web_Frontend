"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";

type InlineTextFieldProps = {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  isEditable?: boolean;
  className?: string;
  textClassName?: string;
};

export function InlineTextField({
  value: initialValue,
  onSave,
  placeholder,
  isEditable = false,
  className = "",
  textClassName = "",
}: InlineTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // 空欄、または変更がない場合は何もしない（元の値に戻して閉じる）
    if (!value.trim() || value === initialValue) {
      setIsEditing(false);
      setValue(initialValue);
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
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          placeholder={placeholder}
          className="flex-1 h-9"
          autoFocus
        />
        {/* disabledはローディング中、または「空欄」の時のみ（変更がなくても押せる） */}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading || !value.trim()}
          className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8 text-slate-500 hover:text-slate-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-2 max-w-full ${className}`}>
      <span 
        // block, truncate, min-w-0 を追加して「...」の省略を有効化
        className={`block truncate min-w-0 ${textClassName}`} 
        title={initialValue} // マウスホバー時にフルネームを表示
      >
        {initialValue}
      </span>
      {isEditable && (
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 h-8 w-8 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => setIsEditing(true)}
          aria-label="編集する"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
