"use client";

import { useState } from "react";

import { FormInput } from "@/components/atoms/FormInput";
import { CitySelectField } from "@/components/molecules/CitySelectField";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";
import { PrefectureSelectField } from "@/components/molecules/PrefectureSelectField";
import { MAX_TEXT_LENGTH } from "@/constants/config";

type ScheduleFieldExampleProps = {
  // venue: 開催場所（都道府県・市区町村・番地）のみ、datetime: 開催日時・終了日時のみ
  variant: "venue" | "datetime";
  idPrefix: string;
};

// 実フォームの「開催情報」ブロックと同じ構成の見本。
// 選択・入力はローカル状態に反映されるが、保存処理につながらないためどこにも送信されない。
// 3.3（開催場所）と 3.4（開催日時）で同じ見本を掲載するため、idPrefix で id の衝突を避ける。
export function ScheduleFieldExample({
  variant,
  idPrefix,
}: Readonly<ScheduleFieldExampleProps>) {
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");

  return (
    <div className="my-5">
      <FormCard title="開催情報">
        {variant === "venue" ? (
          <>
            <PrefectureSelectField
              id={`${idPrefix}-prefecture`}
              value={prefecture}
              onChange={(next) => {
                setPrefecture(next);
                // 実フォームと同じく、都道府県を変えたら市区町村を選び直させる
                setCity("");
              }}
            />

            <CitySelectField
              id={`${idPrefix}-city`}
              prefecture={prefecture}
              value={city}
              onChange={setCity}
            />

            <FormField id={`${idPrefix}-address`} label="番地・施設名等">
              <FormInput
                id={`${idPrefix}-address`}
                maxLength={MAX_TEXT_LENGTH}
                placeholder="例: ○○公園 中央広場"
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField
              id={`${idPrefix}-event-date-time`}
              label="開催日時"
              required
            >
              <FormInput
                id={`${idPrefix}-event-date-time`}
                type="datetime-local"
              />
            </FormField>

            <FormField
              id={`${idPrefix}-end-date-time`}
              label="終了日時"
              required
            >
              <FormInput
                id={`${idPrefix}-end-date-time`}
                type="datetime-local"
              />
            </FormField>
          </>
        )}
      </FormCard>
    </div>
  );
}
