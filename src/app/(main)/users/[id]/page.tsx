"use client";

import { BackLink } from "@/components/atoms/BackLink";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { useProfileEvents } from "@/hooks/useProfileEvents";
import { fetchUserProfile } from "@/services/user";
import type { UserProfileResponse } from "@/types/user";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function UserProfilePage({
  params,
}: {
  // Next.js 15 では params が Promise となるためこのように定義します
  params: Promise<{ id: string }>;
}) {
  // Promise を展開して URL の id を取得
  const { id } = use(params);

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);

  const {
    events: hostedEvents,
    counts,
    isLoading: hostedLoading,
    error: hostedError,
  } = useProfileEvents(id, "hosted");
  const {
    events: participatedEvents,
    isLoading: participatedLoading,
    error: participatedError,
  } = useProfileEvents(id, "attended");

  const isEventsLoading = hostedLoading || participatedLoading;

  // イベント取得エラーをログに出力
  const eventError = hostedError ?? participatedError;
  if (eventError) console.error(eventError);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // Service を経由して対象ユーザーのプロフィールを取得
        const profileData = await fetchUserProfile(id);

        if (!cancelled) {
          setProfile(profileData);
        }
      } catch (err) {
        // 取得失敗時（404含む）は Not Found 扱いとする
        console.error(err);
        if (!cancelled) setIsNotFound(true);
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isDataLoading || isEventsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full bg-slate-300 animate-pulse" />
      </div>
    );
  }

  // 取得失敗、または存在しないユーザーの場合
  if (isNotFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-slate-500">ユーザー情報が見つかりませんでした。</p>
        <Link href="/" className="text-sm text-emerald-600 hover:underline">
          トップページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1192px] pt-2 space-y-8">
      <BackLink href="/">前の画面にもどる</BackLink>

      <h1 className="font-['Zen_Maru_Gothic'] font-bold text-[28px] text-[#272E24] tracking-[0.56px]">
        プロフィール
      </h1>

      <ProfileHeader
        name={profile.displayName}
        avatarUrl={profile.avatarUrl}
        description={profile.description}
        // false を指定して編集UIを確実に非表示にする
        isOwnProfile={false}
        createdAt={profile.createdAt}
        // 何もしないダミーのPromise関数を渡す
        onUpdateName={() => Promise.resolve()}
        onUpdateDescription={() => Promise.resolve()}
      />

      <section>
        <div className="flex items-baseline gap-3">
          <h2 className="font-['Zen_Maru_Gothic'] font-bold text-[19px] leading-[28px] text-[#272E24]">
            主催したイベント
          </h2>
          <span className="text-[13px] leading-[19px] text-[#838C7D]">
            このユーザーが主催したイベント
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
            isOwnProfile={false}
            counts={
              counts
                ? {
                    hosted: counts.hosted,
                    participated: counts.attended,
                  }
                : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}
