"use client";

import { ProfileHeader } from "@/components/molecules/ProfileHeader";

// 実際のプロフィール画面（mypage）と同じ見た目の見本。
// 表示名・自己紹介の編集はできるが、保存ハンドラが空のためどこにも反映されない。
// プロフィール画像を設定するUIは現時点で実装に存在しないため、アバター表示で代用する。
export function ProfileHeaderExample() {
  return (
    <div className="my-5">
      <ProfileHeader
        name="山田 太郎"
        avatarUrl=""
        description="自然観察が好きです。"
        isOwnProfile={true}
        createdAt="2024-04-01T00:00:00Z"
        onUpdateName={async () => {}}
        onUpdateDescription={async () => {}}
      />
    </div>
  );
}
