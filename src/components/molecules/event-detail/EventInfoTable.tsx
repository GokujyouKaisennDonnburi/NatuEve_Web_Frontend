import { EventItemBadge } from "@/components/molecules/EventItemBadge";
import { SurfaceCard } from "@/components/molecules/SurfaceCard";
import { CardContent } from "@/components/ui/card";
import type { EventDetailType } from "./types";

// イベント情報表コンポーネントのプロパティ型定義
type EventInfoTableProps = {
  event: Pick<
    EventDetailType,
    | "organizerName"
    | "organizerAvatarUrl"
    | "profile"
    | "eventDate"
    | "endDate"
    | "location"
    | "externalUrl"
    | "costs"
    | "items"
    | "capacity"
  >;
};

// RFC3339 の日時文字列を日本時間の表示用文字列へ整形する。
// 空文字や不正な日時の場合は「—」を返す（プレビュー表示時を想定）。
const formatDateTime = (value: string): string => {
  if (!value.trim()) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return parsed.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
};

// 参加費1件分を表示用に整形する。
// 金額が0円のときは「無料」と表示し、カテゴリが未入力のときは金額だけを表示する。
const formatCost = ({
  category,
  cost,
}: EventDetailType["costs"][number]): string => {
  const amount = cost === 0 ? "無料" : `${cost.toLocaleString()}円`;
  const label = category.trim();
  return label ? `${label}：${amount}` : amount;
};

// イベント情報表コンポーネント
export function EventInfoTable({ event }: Readonly<EventInfoTableProps>) {
  const organizerName = event.profile?.displayName ?? event.organizerName;

  return (
    <SurfaceCard>
      <CardContent>
        <h2 className="section-title">イベント詳細</h2>
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                {/* 主催者 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-(--surface-muted) text-sm font-semibold text-slate-700">
                    主催者
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    <span className="text-sm font-medium text-slate-800">
                      {organizerName ?? "未設定"}
                    </span>
                  </td>
                </tr>

                {/* 開催日時 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-(--surface-muted) text-sm font-semibold text-slate-700">
                    開催日時
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {formatDateTime(event.eventDate)}
                  </td>
                </tr>

                {/* 終了日時 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-(--surface-muted) text-sm font-semibold text-slate-700">
                    終了日時
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {formatDateTime(event.endDate)}
                  </td>
                </tr>

                {/* 開催場所 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-(--surface-muted) text-sm font-semibold text-slate-700">
                    開催場所
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.location}
                  </td>
                </tr>

                {/* 参加費 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-(--surface-muted) text-sm font-semibold text-slate-700">
                    参加費
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.costs.length > 0 ? (
                      // 複数の参加費は1行ずつ縦に並べる
                      <ul className="space-y-1">
                        {event.costs.map((cost) => (
                          <li key={`${cost.category}-${cost.cost}`}>
                            {formatCost(cost)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "無料"
                    )}
                  </td>
                </tr>

                {/* 持ち物 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-(--surface-muted) text-sm font-semibold text-slate-700">
                    持ち物
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.items && event.items.length > 0 ? (
                      <ul className="space-y-2">
                        {event.items.map((item) => (
                          <li key={item.item}>
                            <EventItemBadge
                              item={item.item}
                              isRequired={item.isRequired}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "なし"
                    )}
                  </td>
                </tr>

                {/* 定員 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-(--surface-muted) text-sm font-semibold text-slate-700">
                    定員
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.capacity === 0 ? "定員なし" : `${event.capacity}名`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </SurfaceCard>
  );
}
