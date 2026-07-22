"use client";

import type { EventItem } from "@/components/EventCard";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { apiFetch } from "@/services/apiClient";
import Link from "next/link";
import { use, useEffect, useState } from "react";

// GET /api/v1/profiles/{id} のレスポンス型
type UserProfileResponse = {
  id: string;
  displayName: string;
  avatarUrl: string;
  description?: string;
};

type ApiStatusError = Error & {
  status: number;
};

const isApiStatusError = (error: unknown): error is ApiStatusError =>
  error instanceof Error &&
  "status" in error &&
  typeof error.status === "number";

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
        // 対象ユーザーのプロフィールを取得
        const res = await apiFetch(`/api/v1/profiles/${id}`);

        if (!res.ok) {
          throw Object.assign(
            new Error(`Failed to fetch profile (Status: ${res.status})`),
            { status: res.status },
          );
        }

        const profileData = (await res.json()) as UserProfileResponse;

        if (!cancelled) {
          setProfile(profileData);

          // ==========================================
          // 今後、ユーザーのイベント取得APIが実装されたらここに追加
          // ==========================================
          // const [hostedRes, participatedRes] = await Promise.all([
          //   apiFetch(`/api/v1/users/${id}/events/hosted`),
          //   apiFetch(`/api/v1/users/${id}/events/participated`),
          // ]);
          // ==========================================

          setHostedEvents([]);
          setParticipatedEvents([]);
        }
      } catch (err) {
        if (
          isApiStatusError(err) &&
          (err.status === 401 || err.status === 404)
        ) {
          if (!cancelled) setIsNotFound(true);
        }
        console.error(err);
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
        // 何もしないダミーのPromise関数を渡す
        onUpdateName={() => Promise.resolve()}
        onUpdateDescription={() => Promise.resolve()}
      />
      <UserEventTabs
        hostedEvents={hostedEvents}
        participatedEvents={participatedEvents}
      />
    </div>
  );
}
