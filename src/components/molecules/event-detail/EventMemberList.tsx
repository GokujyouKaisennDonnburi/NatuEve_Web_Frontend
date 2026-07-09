"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useEventMembers } from "@/hooks/useEventMembers";
import { Users } from "lucide-react";

type EventMemberListProps = {
  eventId: string;
};

// 申込日時を日本語表記へ整形する（EventReportList と同じフォーマット）。
const formatCreatedAt = (iso: string): string =>
  new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

// イベント参加者一覧コンポーネント。
// 主催者向けに GET /api/v1/events/{id}/members の結果を表示する。
// ローディング・エラー・空データそれぞれの表示状態を持つ。
export function EventMemberList({ eventId }: Readonly<EventMemberListProps>) {
  const { data, isLoading, error } = useEventMembers(eventId);

  return (
    <Card>
      <CardContent>
        <h2 className="section-title flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-500" />
          参加者一覧
        </h2>

        {isLoading ? (
          <div className="mt-4 text-sm text-slate-500">読み込み中…</div>
        ) : error ? (
          <div className="mt-4 text-sm text-red-600">
            {error.message ?? "参加者一覧の取得に失敗しました"}
          </div>
        ) : !data || data.members.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500">
            まだ参加者はいません。
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* 参加組数・合計参加人数サマリー */}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                参加組数: {data.totalCount}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                合計参加人数: {data.totalMembers}
              </span>
            </div>

            {/* 参加者テーブル */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">ユーザー名</th>
                    <th className="px-4 py-3 font-medium">メールアドレス</th>
                    <th className="px-4 py-3 font-medium">参加人数</th>
                    <th className="px-4 py-3 font-medium">申込日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.members.map((member) => (
                    <tr key={member.id} className="align-top">
                      <td className="px-4 py-3 text-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{member.username}</span>
                          {member.profileId === null ? (
                            <span className="text-[11px] text-slate-400">
                              匿名参加
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 break-all text-slate-700">
                        {member.mailAddress}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {member.partySize}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {formatCreatedAt(member.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventMemberList;
