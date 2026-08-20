"use client";

import { BackLink } from "@/components/atoms/BackLink";
import { useCurrentUserContext } from "@/components/layouts/AuthProvider";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { useMyEvents } from "@/hooks/useMyEvents";
import { updateMyProfile } from "@/services/user";
import Link from "next/link";

export default function MyPage() {
  const {
    user: profile,
    isUserLoading,
    setUser: setProfile,
  } = useCurrentUserContext();

  const {
    events: hostedEvents,
    counts,
    isLoading: hostedLoading,
  } = useMyEvents("hosted");
  const {
    events: appliedEvents,
    isLoading: appliedLoading,
  } = useMyEvents("applied");
  const {
    events: participatedEvents,
    isLoading: participatedLoading,
  } = useMyEvents("attended");

  const isEventsLoading = hostedLoading || appliedLoading || participatedLoading;

  if (isUserLoading || isEventsLoading) {
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
            counts={
              counts
                ? {
                    hosted: counts.hosted,
                    participated: counts.attended,
                    applied: counts.applied,
                  }
                : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}
