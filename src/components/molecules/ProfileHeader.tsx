import { EditIconButton } from "@/components/atoms/EditIconButton";
import { GlobalUserAvatar } from "@/components/molecules/GlobalUserAvatar";

type ProfileHeaderProps = {
  name: string;
  avatarUrl: string;
  bio?: string;
  isOwnProfile: boolean; // 自分のプロフィールかどうかを判定するフラグ
};

export function ProfileHeader({
  name,
  avatarUrl,
  bio,
  isOwnProfile,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm">
      {/* 1. アイコン領域 */}
      <div className="relative shrink-0">
        <GlobalUserAvatar
          name={name}
          iconUrl={avatarUrl}
          className="w-20 h-20 sm:w-24 sm:h-24 text-2xl"
        />
        {/* 自分のプロフィールの時だけ、アイコンの右下に編集ボタンを配置 */}
        {isOwnProfile && (
          <div className="absolute -bottom-1 -right-1">
            <EditIconButton
              label="アイコンを編集する"
              className="bg-white shadow-sm border border-slate-200 h-7 w-7 text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
            />
          </div>
        )}
      </div>

      {/* 2. ユーザー情報・自己紹介領域 */}
      <div className="flex-1 text-center sm:text-left space-y-3 w-full min-w-0">
        {/* ユーザー名 */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <h2 className="text-xl font-bold text-slate-900 truncate">{name}</h2>
          {isOwnProfile && <EditIconButton label="ユーザー名を編集する" />}
        </div>

        {/* 自己紹介 (ホバーすると編集ボタンが出るスタイル) */}
        <div className="relative p-3 bg-slate-50 rounded-lg border border-slate-100 group min-h-[4rem]">
          {isOwnProfile && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <EditIconButton label="自己紹介を編集する" />
            </div>
          )}
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pr-6 text-left">
            {bio || "自己紹介がまだ設定されていません。"}
          </p>
        </div>
      </div>
    </div>
  );
}
