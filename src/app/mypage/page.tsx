"use client";

import type { EventItem } from "@/components/EventCard";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/services/apiClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type UserProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
  description?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MeApiResponse = {
  id: string;
  email?: string;
  description?: string;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiStatusError = Error & {
  status: number;
};

const meRequestCache = new Map<string, Promise<MeApiResponse>>();

const isApiStatusError = (error: unknown): error is ApiStatusError =>
  error instanceof Error &&
  "status" in error &&
  typeof error.status === "number";

const fetchMeWithToken = (token: string) => {
  const cachedRequest = meRequestCache.get(token);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = apiFetch("/api/v1/me", {
    auth: false,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw Object.assign(
        new Error(`Failed to fetch my profile (Status: ${res.status})`),
        { status: res.status },
      );
    }

    return (await res.json()) as MeApiResponse;
  });

  meRequestCache.set(token, request);
  request.then(
    () => meRequestCache.delete(token),
    () => meRequestCache.delete(token),
  );

  return request;
};

const toUserProfile = (data: MeApiResponse): UserProfile => ({
  id: data.id,
  displayName: data.displayName ?? data.display_name ?? "",
  avatarUrl: data.avatarUrl ?? data.avatar_url ?? "",
  description: data.description,
  email: data.email,
  createdAt: data.createdAt ?? data.created_at,
  updatedAt: data.updatedAt ?? data.updated_at,
});

export default function MyPage() {
  const { session, isLoading: isSessionLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);

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
        // 1. 自身のプロフィールを取得
        const profileData = toUserProfile(
          await fetchMeWithToken(session.token),
        );

        if (!cancelled) {
          setProfile(profileData);

          // ==========================================
          // イベント取得APIが実装されたらここを追加
          // ==========================================
          // const myId = profileData.id;
          // const [hostedRes, participatedRes] = await Promise.all([
          //   fetch(`/api/v1/users/${myId}/events/hosted`, { headers }),
          //   fetch(`/api/v1/users/${myId}/events/participated`, { headers }),
          // ]);
          //
          // 各resのok判定と、setHostedEvents / setParticipatedEvents への格納処理をここに書く
          // ==========================================

          // 今回はAPIがないため、空配列のままローディングを終了させる
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
  }, [session, isSessionLoading]);

  if (isSessionLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-300 animate-pulse" />
      </div>
    );
  }

  if (isNotFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex flex-col items-center justify-center gap-4">
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
    const res = await apiFetch(`/api/v1/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ display_name: newName }),
    });

    if (!res.ok) throw new Error("名前の更新に失敗しました");
    setProfile((prev) => (prev ? { ...prev, displayName: newName } : null));
  };

  const handleUpdateDescription = async (newDescription: string) => {
    const res = await apiFetch(`/api/v1/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description: newDescription }),
    });

    if (!res.ok) throw new Error("自己紹介の更新に失敗しました");
    setProfile((prev) =>
      prev ? { ...prev, description: newDescription } : null,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-6 pb-16 space-y-8">
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
      </main>
    </div>
  );
}
