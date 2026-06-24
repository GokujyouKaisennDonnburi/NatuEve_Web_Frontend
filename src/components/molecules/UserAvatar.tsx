"use client";

import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const fallbackText = name ? name.charAt(0) : "";

  return (
    <Avatar
      className={`h-8 w-8 border border-slate-200 bg-slate-100 select-none shadow-xs shrink-0 ${className}`}
    >
      {iconUrl && (
        <AvatarImage
          src={iconUrl}
          alt={name ?? "ユーザーアバター"}
          className="object-cover"
        />
      )}
      <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 uppercase">
        {fallbackText || <User className="h-3.5 w-3.5 text-slate-400" />}
      </AvatarFallback>
    </Avatar>
  );
}
