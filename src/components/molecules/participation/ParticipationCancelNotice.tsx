"use client";

import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";

type ParticipationCancelNoticeProps = {
  // 整形済みの期限（例: 「8月11日 23:59」）
  deadlineLabel: string;
  // 期限を過ぎているかどうか
  isExpired: boolean;
};

// 取り消し期限の案内帯。期限内はオレンジ、期限切れは赤で注意を促す。
// 期限切れ後は自分で取り消せないため、主催者への欠席連絡を促す文面に切り替える。
export function ParticipationCancelNotice({
  deadlineLabel,
  isExpired,
}: Readonly<ParticipationCancelNoticeProps>) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        isExpired
          ? "border-(--danger-line) bg-(--danger-soft)"
          : "border-(--brand-orange-line) bg-(--brand-orange-soft)",
      )}
    >
      <CircleAlert
        className={cn(
          "h-5 w-5 shrink-0",
          isExpired ? "text-(--danger)" : "text-(--brand-orange-text)",
        )}
      />
      <div
        className={cn(
          "text-sm leading-relaxed",
          isExpired ? "text-(--danger-text)" : "text-slate-600",
        )}
      >
        {isExpired ? (
          <>
            <p className="font-semibold">
              期限（{deadlineLabel}）を過ぎています
            </p>
            <p className="mt-2 text-center text-xs">
              参加できない場合は、主催者へ欠席の旨をお伝えください。
            </p>
          </>
        ) : (
          <>
            <p>取り消しは {deadlineLabel} までになっています。</p>
            <p>期日以降の取り消しは、主催者の指示に従ってください。</p>
          </>
        )}
      </div>
    </div>
  );
}
