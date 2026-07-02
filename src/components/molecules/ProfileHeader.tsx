"use client";

import { InlineTextField } from "@/components/molecules/InlineTextField";
import { InlineTextareaField } from "@/components/molecules/InlineTextareaField";
import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type ProfileHeaderProps = {
  name: string;
  avatarUrl: string;
  description?: string;
  isOwnProfile: boolean;
  onUpdateName?: (newName: string) => Promise<void>;
  onUpdateDescription?: (newDescription: string) => Promise<void>;
};

export function ProfileHeader({
  name,
  avatarUrl,
  description,
  isOwnProfile,
  onUpdateName,
  onUpdateDescription,
}: ProfileHeaderProps) {
  const [imgError, setImgError] = useState(false);

  const defaultOnSave = async () => {};

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm">
      {/* 1. アイコン領域 (フォールバック対応) */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
        {avatarUrl && !imgError ? (
          <Image
            src={avatarUrl}
            alt={`${name}のアイコン`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <User className="w-10 h-10 sm:w-12 sm:h-12" />
        )}
      </div>

      {/* 2. ユーザー情報・自己紹介領域 */}
      <div className="flex-1 text-center sm:text-left space-y-3 w-full min-w-0">
        {/* ユーザー名 (インライン編集) */}
        <div className="flex justify-center sm:justify-start">
          <InlineTextField
            value={name}
            isEditable={isOwnProfile}
            onSave={onUpdateName || defaultOnSave}
            placeholder="ユーザー名を入力"
            textClassName="text-lg font-bold text-slate-900 truncate"
          />
        </div>

        {/* 自己紹介 (インライン編集) */}
        <div className="relative p-3 bg-slate-50 rounded-lg border border-slate-100 min-h-[4rem] text-left">
          <InlineTextareaField
            value={description || ""}
            isEditable={isOwnProfile}
            onSave={onUpdateDescription || defaultOnSave}
            placeholder="自己紹介を入力してみましょう！"
            textClassName="text-sm text-slate-600 leading-relaxed pr-6"
          />
        </div>
      </div>
    </div>
  );
}
