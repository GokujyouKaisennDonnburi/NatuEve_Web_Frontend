"use client";

import { useState } from "react";

import { ProfileHeader } from "@/components/molecules/ProfileHeader";

// 実際のプロフィール画面（mypage）と同じ見た目の見本。
// 表示名・自己紹介の編集はローカル状態に反映されるが、保存処理につながらないためどこにも送信されない。
// プロフィール画像を設定するUIは現時点で実装に存在しないため、アバター表示で代用する。
export function ProfileHeaderExample() {
  const [name, setName] = useState("山田 太郎");
  const [description, setDescription] = useState("自然観察が好きです。");

  return (
    <div className="my-5">
      <ProfileHeader
        name={name}
        avatarUrl=""
        description={description}
        isOwnProfile={true}
        createdAt="2024-04-01T00:00:00Z"
        onUpdateName={async (newName) => {
          setName(newName);
        }}
        onUpdateDescription={async (newDescription) => {
          setDescription(newDescription);
        }}
      />
    </div>
  );
}
