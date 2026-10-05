"use client";

import { EditPillButton } from "@/components/atoms/EditPillButton";
import { SignOutButton } from "@/components/atoms/SignOutButton";
import { InlineTextField } from "@/components/molecules/InlineTextField";
import { InlineTextareaField } from "@/components/molecules/InlineTextareaField";
import Image from "next/image";
import { useState } from "react";

type ProfileHeaderProps = {
  name: string;
  avatarUrl: string;
  description?: string;
  isOwnProfile: boolean;
  createdAt?: string;
  onUpdateName?: (newName: string) => Promise<void>;
  onUpdateDescription?: (newDescription: string) => Promise<void>;
  onSignOut?: () => void;
  isSigningOut?: boolean;
};

function formatMemberSince(createdAt?: string): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}年から利用`;
}

export function ProfileHeader({
  name,
  avatarUrl,
  description,
  isOwnProfile,
  createdAt,
  onUpdateName,
  onUpdateDescription,
  onSignOut,
  isSigningOut,
}: ProfileHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const [forceEditName, setForceEditName] = useState(false);
  const [forceEditDesc, setForceEditDesc] = useState(false);

  const defaultOnSave = async () => {};

  const memberSince = formatMemberSince(createdAt);
  const firstChar = name.trim().charAt(0) || "?";

  return (
    <div className="rounded-2xl border border-[#E3E8DF] bg-white p-4 shadow-[0px_1px_2px_rgba(39,46,36,0.05),0px_4px_12px_rgba(39,46,36,0.06)] sm:p-6 lg:p-[29px]">
      {/* アバター + 名前行 */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-4 sm:flex-nowrap sm:gap-x-[27px]">
        {/* アバター */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#97C459] sm:h-[76px] sm:w-[76px]">
          {avatarUrl && !imgError ? (
            <Image
              width={76}
              height={76}
              src={avatarUrl}
              alt={`${name}のアイコン`}
              className="w-full h-full object-cover"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="font-['Zen_Maru_Gothic'] font-bold text-[30px] leading-[43px] text-[#1E2C10] text-center">
              {firstChar}
            </span>
          )}
        </div>

        {/* 名前 + 利用開始年 */}
        <div className="min-w-0 flex-1 pt-1 sm:pt-[10px]">
          <div className="flex items-center gap-2 flex-wrap">
            <InlineTextField
              value={name}
              isEditable={isOwnProfile}
              onSave={onUpdateName || defaultOnSave}
              placeholder="ユーザー名を入力"
              forceEdit={forceEditName}
              onConsumeForceEdit={() => setForceEditName(false)}
              textClassName="break-words font-['Zen_Maru_Gothic'] text-xl leading-7 font-bold tracking-[0.48px] text-[#272E24] sm:truncate sm:text-[24px] sm:leading-[35px]"
              editTrigger={(onClick) => (
                <EditPillButton size="md" onClick={onClick} />
              )}
            />
          </div>
          {memberSince && (
            <p className="mt-[6px] text-[13px] leading-[19px] text-[#838C7D] font-['Zen_Kaku_Gothic_New']">
              {memberSince}
            </p>
          )}
        </div>

        {/* サインアウトボタン（本人のプロフィールのみ） */}
        {isOwnProfile && onSignOut && (
          <div className="w-full sm:w-auto sm:shrink-0">
            <SignOutButton
              onClick={onSignOut}
              disabled={isSigningOut}
              className="w-full justify-center sm:w-auto"
            />
          </div>
        )}
      </div>

      {/* 区切り線 */}
      <div className="mt-5 mb-5 border-t border-[#F1F4EE] sm:mb-6" />

      {/* 自己紹介 */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#272E24]">自己紹介</p>
          {isOwnProfile && (
            <EditPillButton size="sm" onClick={() => setForceEditDesc(true)} />
          )}
        </div>
        <div className="relative">
          <InlineTextareaField
            value={description || ""}
            isEditable={false}
            onSave={onUpdateDescription || defaultOnSave}
            placeholder="自己紹介を入力してみましょう！"
            forceEdit={forceEditDesc}
            onConsumeForceEdit={() => setForceEditDesc(false)}
            textClassName="text-[15px] leading-[28px] text-[#3A4237]"
            className="pr-0"
          />
        </div>
      </div>
    </div>
  );
}
