"use client";

import { useState } from "react";

import { PaymentAlertNote } from "@/components/atoms/event-post/PaymentAlertNote";
import { FormCard } from "@/components/molecules/FormCard";
import type { PriceCategory } from "@/components/molecules/event-post/PriceCategoryField";
import { PriceCategoryField } from "@/components/molecules/event-post/PriceCategoryField";

// 実フォームの「参加費用」ブロックと同じ構成の見本。
// 入力・行の追加はローカル状態に反映されるが、保存処理につながらないためどこにも送信されない。
export function PriceFieldExample() {
  const [items, setItems] = useState<PriceCategory[]>([
    { category: "一般", amount: "500" },
  ]);

  return (
    <div className="my-5">
      <FormCard
        title="参加費用"
        required
        description="分類ごとに金額を設定できます。無料の場合は 0 と入力してください。"
      >
        <PaymentAlertNote />
        <PriceCategoryField items={items} onItemsChange={setItems} />
      </FormCard>
    </div>
  );
}
