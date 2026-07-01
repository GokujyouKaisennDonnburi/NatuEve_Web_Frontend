"use client";

import type { EventItem } from "@/components/EventCard";
import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { UserEventTabs } from "@/components/organisms/UserEventTabs";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

type PageProps = {
  params: Promise<{ id: string }>;
};

type UserProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
};

// ユーザーのイベント情報を取得するAPIのレスポンス型
type UserEventApiItem = Pick<
  EventItem,
  "id" | "title" | "location" | "createdAt" | "eventDate" | "profileId"
>;

// ユーザーのイベント情報をまとめたレスポンス型
type UserEventListResponse = {
  events: UserEventApiItem[];
};

export default function UserProfilePage(props: PageProps) {
  const params = use(props.params);
  const userId = params.id;

  const { session, isLoading: isSessionLoading } = useAuth();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hostedEvents, setHostedEvents] = useState<EventItem[]>([]);
  const [participatedEvents, setParticipatedEvents] = useState<EventItem[]>([]);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (isSessionLoading) return;

      try {
        const headers = new Headers();
        if (session?.token) {
          headers.set("Authorization", `Bearer ${session.token}`);
        }

        // 1. ログイン中ユーザー情報の取得
        if (session?.token) {
          const meRes = await fetch("/api/v1/me", { headers });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (!cancelled) setCurrentUserId(meData.id);
          }
        }

        // 2. 表示対象のユーザープロフィールを取得
        const profileRes = await fetch(`/api/v1/users/${userId}`);
        if (!profileRes.ok) {
          if (profileRes.status === 404 && !cancelled) setIsNotFound(true);
          throw new Error("User not found");
        }
        const profileData = (await profileRes.json()) as UserProfile;

        // 3. イベント情報の取得
        const [hostedRes, participatedRes] = await Promise.all([
          fetch(`/api/v1/users/${userId}/events/hosted`),
          fetch(`/api/v1/users/${userId}/events/participated`),
        ]);

        let hEvents: EventItem[] = [];
        let pEvents: EventItem[] = [];

        if (hostedRes.ok) {
          const data = (await hostedRes.json()) as UserEventListResponse;
          hEvents = data.events.map((e) => ({
            ...e,
            hostName: profileData.displayName,
            hostAvatarUrl: profileData.avatarUrl,
            dateLabel: new Date(e.eventDate).toLocaleDateString("ja-JP", {
              month: "short",
              day: "numeric",
              timeZone: "Asia/Tokyo",
            }),
          }));
        }

        if (participatedRes.ok) {
          const data = (await participatedRes.json()) as UserEventListResponse;
          pEvents = data.events.map((e) => ({
            ...e,
            hostName: "主催者", 
            hostAvatarUrl: "",
            dateLabel: new Date(e.eventDate).toLocaleDateString("ja-JP", {
              month: "short",
              day: "numeric",
              timeZone: "Asia/Tokyo",
            }),
          }));
        }

        if (!cancelled) {
          setProfile(profileData);
          setHostedEvents(hEvents);
          setParticipatedEvents(pEvents);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [userId, session, isSessionLoading]);

  // ローディング表示
  if (isSessionLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-300 animate-pulse" />
      </div>
    );
  }

  // プロフィールが見つからなかった場合のエラーハンドリング
  if (isNotFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">ユーザーが見つかりませんでした。</p>
        <Link href="/" className="text-sm text-emerald-600 hover:underline">
          トップページに戻る
        </Link>
      </div>
    );
  }

  // ヘッダーを作成する共通関数を用意
  const getAuthHeaders = () => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (session?.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }
    return headers;
  };

  const handleUpdateName = async (newName: string) => {
    // 認証ヘッダーを付与
    const res = await fetch(`/api/v1/users/${userId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ displayName: newName }),
    });

    if (!res.ok) throw new Error("名前の更新に失敗しました");

    setProfile((prev) => (prev ? { ...prev, displayName: newName } : null));
  };

  const handleUpdateBio = async (newBio: string) => {
    // 認証ヘッダーを付与
    const res = await fetch(`/api/v1/users/${userId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ bio: newBio }),
    });

    if (!res.ok) throw new Error("自己紹介の更新に失敗しました");

    setProfile((prev) => (prev ? { ...prev, bio: newBio } : null));
  };

  const isOwnProfile = currentUserId === userId;

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
          bio={profile.bio}
          isOwnProfile={isOwnProfile}
          onUpdateName={handleUpdateName}
          onUpdateBio={handleUpdateBio}
        />
        <UserEventTabs
          hostedEvents={hostedEvents}
          participatedEvents={participatedEvents}
        />
      </main>
    </div>
  );
}