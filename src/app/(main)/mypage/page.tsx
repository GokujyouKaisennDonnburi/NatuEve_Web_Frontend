"use client";

import { BackLink } from "@/components/atoms/BackLink";
import { useCurrentUserContext } from "@/components/layouts/AuthProvider";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import type { EventItem } from "@/components/organisms/EventCard";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { updateMyProfile } from "@/services/user";
import Link from "next/link";
import { useState } from "react";

export default function MyPage() {
  // プロフィールはヘッダーと共有された Provider から取得する。
  // setUser で更新すればヘッダーの表示名・アイコンにも即座に反映される。
  const {
    user: profile,
    isUserLoading,
    setUser: setProfile,
  } = useCurrentUserContext();

  // ==========================================
  // イベント取得APIが実装されたら、ここで取得して State へ格納する
  // ==========================================
  // const [hostedRes, participatedRes] = await Promise.all([
  //   fetchHostedEvents(profile.id),
  //   fetchParticipatedEvents(profile.id),
  // ]);
  // ==========================================
  // 今後のAPI実装時にそのまま使えるよう、Stateは残しておきます
  const [hostedEvents] = useState<EventItem[]>([]);
  const [participatedEvents] = useState<EventItem[]>([]);
  const [appliedEvents] = useState<EventItem[]>([]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full bg-slate-300 animate-pulse" />
      </div>
    );
  }

  // 未ログイン、または /api/v1/me の取得に失敗した場合
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-slate-500">
          ユーザー情報が取得できませんでした。ログインし直してください。
        </p>
        <Link href="/" className="text-sm text-emerald-600 hover:underline">
          トップページに戻る
        </Link>
      </div>
    );
  }

  const handleUpdateName = async (newName: string) => {
    // Service を経由して名前を更新（更新後のプロフィール全体が返る）
    setProfile(await updateMyProfile({ display_name: newName }));
  };

  const handleUpdateDescription = async (newDescription: string) => {
    // Service を経由して自己紹介を更新（更新後のプロフィール全体が返る）
    setProfile(await updateMyProfile({ description: newDescription }));
  };

  return (
    <div className="mx-auto max-w-[1192px] pt-2 space-y-8">
      <BackLink href="/">前の画面にもどる</BackLink>

      <h1 className="font-['Zen_Maru_Gothic'] font-bold text-[28px] text-[#272E24] tracking-[0.56px]">
        マイページ
      </h1>

      <ProfileHeader
        name={profile.displayName}
        avatarUrl={profile.avatarUrl}
        description={profile.description}
        isOwnProfile={true}
        createdAt={profile.createdAt}
        onUpdateName={handleUpdateName}
        onUpdateDescription={handleUpdateDescription}
      />

      <section>
        <div className="flex items-baseline gap-3">
          <h2 className="font-['Zen_Maru_Gothic'] font-bold text-[19px] leading-[28px] text-[#272E24]">
            主催したイベント
          </h2>
          <span className="text-[13px] leading-[19px] text-[#838C7D]">
            あなたが主催したイベント
          </span>
        </div>

        <div className="mt-4">
          <UserEventTabs
            hostedEvents={hostedEvents}
            participatedEvents={participatedEvents}
            appliedEvents={appliedEvents}
            isOwnProfile={true}
          />
        </div>
      </section>
    </div>
  );
}
