import { Plus } from "lucide-react";

import { FormInput } from "@/components/atoms/FormInput";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";
import { UnitInput } from "@/components/molecules/UnitInput";
import { Button } from "@/components/ui/button";
import { MAX_TEXT_LENGTH } from "@/constants/config";

type ReceptionFieldExampleProps = {
  idPrefix?: string;
};

const QUICK_DEADLINE_LABELS = ["開催2日前", "前日", "1週間前"];

// 実フォームの「受付設定」ブロックと同じ構成の見本。
// 実フォームは開催日時が未入力のとき相対指定のかんたん設定を押せないため、
// 見本も空欄状態と同じ押せない見た目にする。
export function ReceptionFieldExample({
  idPrefix = "guideline",
}: Readonly<ReceptionFieldExampleProps>) {
  const quickButtonClassName =
    "h-8 rounded-[10px] border-[#CDD4C8] bg-white px-3 text-xs font-bold text-[#3A4237] shadow-[0px_1px_0px_rgba(39,46,36,0.06)]";

  return (
    <div className="my-5">
      <FormCard
        title="受付設定"
        description="申し込みの受け付け方を設定します。"
      >
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

        <FormField
          id={`${idPrefix}-application-url`}
          label="申し込みURL"
          description="外部フォームに遷移させる場合に使います。"
        >
          <FormInput
            id={`${idPrefix}-application-url`}
            type="url"
            inputMode="url"
            maxLength={MAX_TEXT_LENGTH}
            placeholder="https://（なちゅいべ内で受付する場合は空欄）"
          />
        </FormField>
      </FormCard>
    </div>
  );
}
