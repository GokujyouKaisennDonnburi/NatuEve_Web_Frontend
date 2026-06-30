"use client";

import { EditableAvatar } from "@/components/molecules/EditableAvatar";
import { InlineTextField } from "@/components/molecules/InlineTextField";
import { InlineTextareaField } from "@/components/molecules/InlineTextareaField";

type ProfileHeaderProps = {
  name: string;
  avatarUrl: string;
  bio?: string;
  isOwnProfile: boolean;
  // 保存時に実行される関数を親から受け取る
  onUpdateName?: (newName: string) => Promise<void>;
  onUpdateBio?: (newBio: string) => Promise<void>;
  onUpdateAvatar?: (file: File) => Promise<void>;
};

export function ProfileHeader({
  name,
  avatarUrl,
  bio,
  isOwnProfile,
  onUpdateName,
  onUpdateBio,
  onUpdateAvatar,
}: ProfileHeaderProps) {
  // 保存関数が渡されていない場合のフォールバック（エラー防止）
  const defaultOnSave = async () => {};

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm">
      {/* 1. アイコン領域 */}
      <EditableAvatar
        name={name}
        avatarUrl={avatarUrl}
        isEditable={isOwnProfile}
        onSave={onUpdateAvatar || defaultOnSave}
        className="w-20 h-20 sm:w-24 sm:h-24"
      />

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
            value={bio || ""}
            isEditable={isOwnProfile}
            onSave={onUpdateBio || defaultOnSave}
            placeholder="自己紹介を入力してみましょう！"
            textClassName="text-sm text-slate-600 leading-relaxed pr-6"
          />
        </div>
      </div>
    </div>
  );
}