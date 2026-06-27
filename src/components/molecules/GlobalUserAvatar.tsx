"use client";

import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// ユーザーアバターコンポーネントのプロパティ型定義
interface UserAvatarProps {
  name?: string;
  iconUrl?: string;
  className?: string;
}

// 競合を回避のため関数名は GlobalUserAvatar にしてる
export function GlobalUserAvatar({
  name,
  iconUrl,
  className = "",
}: UserAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const fallbackText = name ? name.charAt(0) : "";
  const imageSrc = iconUrl ?? "";

  const shouldShowImage = imageSrc.length > 0 && !hasImageError;

  return (
    <span
      className={`relative flex h-8 w-8 shrink-0 select-none overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-xs ${className}`}
      role="img"
      aria-label={name ?? "ユーザーアバター"}
    >
      {shouldShowImage && iconUrl ? (
        <Image
          key={imageSrc}
          src={imageSrc}
          alt={name ?? "ユーザーアバター"}
          width={32}
          height={32}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 uppercase">
          {fallbackText || <User className="h-3.5 w-3.5 text-slate-400" />}
        </div>
      )}
    </span>
  );
}
