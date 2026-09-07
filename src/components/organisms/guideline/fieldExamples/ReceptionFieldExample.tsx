import { Plus } from "lucide-react";

import { FormInput } from "@/components/atoms/FormInput";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";
import { UnitInput } from "@/components/molecules/UnitInput";
import { Button } from "@/components/ui/button";

type ReceptionFieldExampleProps = {
  // capacity: 定員数のみ、deadline: 申し込み締切のみ
  variant: "capacity" | "deadline";
  idPrefix: string;
};

const QUICK_DEADLINE_LABELS = ["開催2日前", "前日", "1週間前"];

// 実フォームの「受付設定」ブロックと同じ構成の見本。
// 実フォームは開催日時が未入力のとき相対指定のかんたん設定を押せないため、
// 見本も空欄状態と同じ押せない見た目にする。
// 3.6（定員）と 3.7（申込期限）で同じ見本を掲載するため、idPrefix で id の衝突を避ける。
export function ReceptionFieldExample({
  variant,
  idPrefix,
}: Readonly<ReceptionFieldExampleProps>) {
  const quickButtonClassName =
    "h-8 rounded-[10px] border-[#CDD4C8] bg-white px-3 text-xs font-bold text-[#3A4237] shadow-[0px_1px_0px_rgba(39,46,36,0.06)]";

  return (
    <div className="my-5">
      <FormCard
        title="受付設定"
        description="申し込みの受け付け方を設定します。"
      >
        {variant === "capacity" ? (
          <FormField id={`${idPrefix}-capacity`} label="定員数">
            <UnitInput
              id={`${idPrefix}-capacity`}
              unit="名"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="例: 30"
            />
          </FormField>
        ) : (
          <FormField
            id={`${idPrefix}-application-deadline`}
            label="申し込み締切"
            description="締切を過ぎると新規の申し込みと参加の取り消しができなくなります。"
          >
            <FormInput
              id={`${idPrefix}-application-deadline`}
              type="datetime-local"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#A8B1A2]">かんたん設定</span>
              {QUICK_DEADLINE_LABELS.map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={quickButtonClassName}
                  disabled
                >
                  <Plus className="h-3 w-3" />
                  {label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={quickButtonClassName}
              >
                <Plus className="h-3 w-3" />
                締切なし
              </Button>
            </div>
          </FormField>
        )}
      </FormCard>
    </div>
  );
}
