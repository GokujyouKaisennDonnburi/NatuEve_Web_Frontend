import { Card, CardContent } from "@/components/ui/card";
import type { EventDetailType } from "./types";

// イベント情報表コンポーネントのプロパティ型定義
type EventInfoTableProps = {
  event: Pick<
    EventDetailType,
    | "organizerName"
    | "organizerAvatarUrl"
    | "eventDate"
    | "location"
    | "costs"
    | "items"
    | "capacity"
  >;
};

// イベント情報表コンポーネント
export function EventInfoTable({ event }: Readonly<EventInfoTableProps>) {
  return (
    <Card>
      <CardContent>
        <h2 className="section-title">イベント情報</h2>
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                {/* 主催者 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-emerald-500 text-sm font-semibold text-white">
                    主催者
                  </th>
                  <td className="border-l  border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    <span className="text-sm font-medium text-slate-800">
                      {event.organizerName ?? "未設定"}
                    </span>
                  </td>
                </tr>

                {/* 開催日時 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-emerald-500 text-sm font-semibold text-white">
                    開催日時
                  </th>
                  <td className="border-l  border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {new Date(event.eventDate).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Tokyo",
                    })}
                  </td>
                </tr>

                {/* 開催場所 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-emerald-500 text-sm font-semibold text-white">
                    開催場所
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.location}
                  </td>
                </tr>

                {/* 参加費 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-emerald-500 text-sm font-semibold text-white">
                    参加費
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.costs.length > 0
                      ? event.costs
                          .map(
                            (cost) =>
                              `${cost.category}: ¥${cost.cost.toLocaleString()}`,
                          )
                          .join(" / ")
                      : ""}
                  </td>
                </tr>

                {/* 持ち物 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-emerald-500 text-sm font-semibold text-white">
                    持ち物
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.items && event.items.length > 0 ? (
                      <ul className="list-disc list-outside space-y-1 pl-5">
                        {event.items.map((item) => (
                          <li key={item.item} className="text-sm">
                            {item.item} {item.isRequired ? "(必須)" : "(任意)"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      ""
                    )}
                  </td>
                </tr>

                {/* 定員 */}
                <tr>
                  <th className="w-44 border-t border-slate-200 py-4 px-4 text-left align-top bg-emerald-500 text-sm font-semibold text-white">
                    定員
                  </th>
                  <td className="border-l border-t border-slate-200 bg-white px-4 py-4 text-slate-800">
                    {event.capacity ?? ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
