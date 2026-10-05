import { EventItemBadge } from "@/components/molecules/EventItemBadge";
import { SurfaceCard } from "@/components/molecules/SurfaceCard";
import { CardContent } from "@/components/ui/card";
import type { EventDetailType } from "./types";
import { Fragment } from "react";

// イベント情報表コンポーネントのプロパティ型定義
type EventInfoTableProps = {
  event: Pick<
    EventDetailType,
    | "organizerName"
    | "organizerAvatarUrl"
    | "profile"
    | "eventDate"
    | "endDate"
    | "applicationDeadline"
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
  const detailRows = [
    {
      label: "主催者",
      value: (
        <span className="text-sm font-medium text-slate-800">
          {organizerName ?? "未設定"}
        </span>
      ),
    },
    { label: "開催日時", value: formatDateTime(event.eventDate) },
    { label: "終了日時", value: formatDateTime(event.endDate) },
    {
      label: "申込期限",
      // 締切なしのイベントは applicationDeadline が空のため「なし」を表示する
      value: event.applicationDeadline
        ? formatDateTime(event.applicationDeadline)
        : "なし",
    },
    { label: "開催場所", value: event.location },
    {
      label: "参加費",
      value:
        event.costs.length > 0 ? (
          <ul className="space-y-1">
            {event.costs.map((cost) => (
              <li key={`${cost.category}-${cost.cost}`}>{formatCost(cost)}</li>
            ))}
          </ul>
        ) : (
          "無料"
        ),
    },
    {
      label: "持ち物",
      value:
        event.items && event.items.length > 0 ? (
          <ul className="space-y-2">
            {event.items.map((item) => (
              <li key={item.item}>
                <EventItemBadge item={item.item} isRequired={item.isRequired} />
              </li>
            ))}
          </ul>
        ) : (
          "なし"
        ),
    },
    {
      label: "定員",
      value: event.capacity === 0 ? "定員なし" : `${event.capacity}名`,
    },
  ];

  return (
    <SurfaceCard>
      <CardContent className="px-4 sm:px-6">
        <h2 className="section-title">イベント詳細</h2>
        <dl className="grid overflow-hidden rounded-xl border border-slate-200 bg-white text-sm sm:grid-cols-[11rem_minmax(0,1fr)]">
          {detailRows.map((row) => (
            <Fragment key={row.label}>
              <dt className="border-t border-slate-200 bg-(--surface-muted) px-3 py-2.5 text-left text-sm font-semibold text-slate-700 first:border-t-0 sm:px-4 sm:py-4 sm:first:border-t">
                {row.label}
              </dt>
              <dd className="min-w-0 break-words bg-white px-3 py-3 text-slate-800 sm:border-t sm:border-l sm:border-slate-200 sm:px-4 sm:py-4">
                {row.value}
              </dd>
            </Fragment>
          ))}
        </dl>
      </CardContent>
    </SurfaceCard>
  );
}
