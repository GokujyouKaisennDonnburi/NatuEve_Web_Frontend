"use client";

import type { EventItem } from "@/components/organisms/EventCard";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
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

  // 今後のイベント取得API実装時に備えてStateを残す
  const [hostedEvents, setHostedEvents] = useState<EventItem[]>([]);
  const [participatedEvents, setParticipatedEvents] = useState<EventItem[]>([]);

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

          // ==========================================
          // 今後、ユーザーのイベント取得APIが実装されたらここに追加
          // ==========================================
          // const [hostedRes, participatedRes] = await Promise.all([
          //   fetchHostedEvents(id),
          //   fetchParticipatedEvents(id),
          // ]);
          // ==========================================

          setHostedEvents([]);
          setParticipatedEvents([]);
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

  if (isDataLoading) {
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
    <div className="mx-auto max-w-xl pt-2 space-y-8">
      <ProfileHeader
        name={profile.displayName}
        avatarUrl={profile.avatarUrl}
        description={profile.description}
        // false を指定して編集UI（鉛筆マークなど）を確実に非表示にする
        isOwnProfile={false}
        createdAt={profile.createdAt}
        // 何もしないダミーのPromise関数を渡す
        onUpdateName={() => Promise.resolve()}
        onUpdateDescription={() => Promise.resolve()}
      />
      <UserEventTabs
        hostedEvents={hostedEvents}
        participatedEvents={participatedEvents}
        isOwnProfile={false}
      />
    </div>
  );
}
