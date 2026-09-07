"use client";

import { PaymentAlertNote } from "@/components/atoms/event-post/PaymentAlertNote";
import { FormCard } from "@/components/molecules/FormCard";
import { PriceCategoryField } from "@/components/molecules/event-post/PriceCategoryField";

// 実フォームの「参加費用」ブロックと同じ構成の見本。
// 入力・行の追加はできるが、onItemsChange に何も流れないため保存されない。
export function PriceFieldExample() {
  return (
    <div className="my-5">
      <FormCard
        title="参加費用"
        required
        description="分類ごとに金額を設定できます。無料の場合は 0 と入力してください。"
      >
        <PaymentAlertNote />
        <PriceCategoryField
          items={[{ category: "一般", amount: "500" }]}
          onItemsChange={() => {}}
        />
      </FormCard>
    </div>
  );
}
