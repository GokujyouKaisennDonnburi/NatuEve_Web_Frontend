"use client";

import type { EventItem } from "@/components/organisms/EventCard";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { useAuth } from "@/hooks/useAuth";
import { fetchCurrentUser, updateMyProfile } from "@/services/user";
import type { CurrentUser } from "@/types/user";
import type { UpdateMyProfileResponse } from "@/types/user";
import Link from "next/link";
import { useEffect, useState } from "react";

// 取得したプロフィールを更新用に変換するヘルパー
const toProfile = (data: CurrentUser) => ({
  id: data.id,
  displayName: data.displayName,
  avatarUrl: data.avatarUrl,
  description: data.description,
  email: data.email,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

type ProfileState = ReturnType<typeof toProfile> | null;

// 更新後のプロフィール（MeResponse/snake_case）を画面表示用の形に変換
const toProfileFromResponse = (data: UpdateMyProfileResponse) => ({
  id: data.id,
  displayName: data.display_name,
  avatarUrl: data.avatar_url,
  description: data.description,
  email: data.email,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export default function MyPage() {
  const { session, isLoading: isSessionLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileState>(null);

  // 今後のAPI実装時にそのまま使えるよう、Stateは残しておきます
  const [hostedEvents, setHostedEvents] = useState<EventItem[]>([]);
  const [participatedEvents, setParticipatedEvents] = useState<EventItem[]>([]);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (isSessionLoading) return;
      if (!session?.token) {
        if (!cancelled) {
          setIsNotFound(true);
          setIsDataLoading(false);
        }
        return;
      }

      try {
        // Service を経由して自身のプロフィールを取得
        const currentUser = await fetchCurrentUser();

        if (!cancelled) {
          setProfile(toProfile(currentUser));

          // ==========================================
          // イベント取得APIが実装されたらここを追加
          // ==========================================
          // const myId = currentUser.id;
          // const [hostedRes, participatedRes] = await Promise.all([
          //   fetchHostedEvents(myId),
          //   fetchParticipatedEvents(myId),
          // ]);
          //
          // 各resのok判定と、setHostedEvents / setParticipatedEvents への格納処理をここに書く
          // ==========================================

          // 今回はAPIがないため、空配列のままローディングを終了させる
          setHostedEvents([]);
          setParticipatedEvents([]);
        }
      } catch (err) {
        // 認証エラーやNot Found等、取得失敗時は未取得状態として扱う
        console.error(err);
        if (!cancelled) {
          setIsNotFound(true);
        }
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [session, isSessionLoading]);

  if (isSessionLoading || isDataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full bg-slate-300 animate-pulse" />
      </div>
    );
  }

  if (isNotFound || !profile) {
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
    // Service を経由して名前を更新
    const updated = await updateMyProfile({ display_name: newName });
    setProfile((prev) => {
      if (!prev) return null;
      const next = toProfileFromResponse(updated);
      return { ...prev, ...next };
    });
  };

  const handleUpdateDescription = async (newDescription: string) => {
    // Service を経由して自己紹介を更新
    const updated = await updateMyProfile({ description: newDescription });
    setProfile((prev) => {
      if (!prev) return null;
      const next = toProfileFromResponse(updated);
      return { ...prev, ...next };
    });
  };

  return (
    <div className="mx-auto max-w-xl pt-2 space-y-8">
      <ProfileHeader
        name={profile.displayName}
        avatarUrl={profile.avatarUrl}
        description={profile.description}
        isOwnProfile={true}
        onUpdateName={handleUpdateName}
        onUpdateDescription={handleUpdateDescription}
      />
      {/* APIから取得できない間は、「まだイベントがありません」等の初期UIが安全に表示されます */}
      <UserEventTabs
        hostedEvents={hostedEvents}
        participatedEvents={participatedEvents}
      />
    </div>
  );
}
