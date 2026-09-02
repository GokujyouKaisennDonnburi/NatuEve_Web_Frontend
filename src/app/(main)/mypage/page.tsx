"use client";

import { BackLink } from "@/components/atoms/BackLink";
import { useCurrentUserContext } from "@/components/layouts/AuthProvider";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { useMyEvents } from "@/hooks/useMyEvents";
import { signOut } from "@/services/auth";
import { updateMyProfile } from "@/services/user";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

export default function MyPage() {
  const router = useRouter();
  // サインアウト処理中フラグ。ボタン単位で無効化して連打による多重実行を防ぐ。
  // 成功時は遷移で画面が消えるためフラグを戻さず、失敗時のみ解除する
  // （フラグを戻すと session クリアにより profile が null になり、
  // 遷移完了前に「ログインし直してください」が一瞬表示されるため）。
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    user: profile,
    isUserLoading,
    setUser: setProfile,
  } = useCurrentUserContext();

  const {
    events: hostedEvents,
    counts,
    isLoading: hostedLoading,
    error: hostedError,
  } = useMyEvents("hosted");
  const {
    events: appliedEvents,
    isLoading: appliedLoading,
    error: appliedError,
  } = useMyEvents("applied");
  const {
    events: participatedEvents,
    isLoading: participatedLoading,
    error: participatedError,
  } = useMyEvents("attended");

  const isEventsLoading =
    hostedLoading || appliedLoading || participatedLoading;

  // イベント取得エラーをログに出力
  const eventError = hostedError ?? appliedError ?? participatedError;
  if (eventError) console.error(eventError);

  if (isUserLoading || isEventsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full bg-slate-300 animate-pulse" />
      </div>
    );
  }

  // 未ログイン、または /api/v1/me の取得に失敗した場合
  if (!profile) {
    // サインアウト成功後は session クリアによりここに到達する。
    // router.replace の遷移完了まではスピナーを維持し、
    // 「ログインし直してください」が一瞬表示されるのを防ぐ
    if (isSigningOut) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full bg-slate-300 animate-pulse" />
        </div>
      );
    }

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

  const handleSignOut = async () => {
    // Service を経由してサインアウトする。signOut は画面遷移しないため遷移はここで行う
    // 成功時はフラグを戻さず遷移へ任せ、失敗時のみ解除して再試行できるようにする
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace(ROUTES.EVENT_LIST);
    } catch (error) {
      setIsSigningOut(false);
      console.error("Sign-out failed", error);
      toast.error("サインアウトに失敗しました。もう一度お試しください。");
    }
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
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
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
          {eventError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              イベント一覧の取得に失敗しました。時間をおいて再度お試しください。
            </div>
          )}
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
