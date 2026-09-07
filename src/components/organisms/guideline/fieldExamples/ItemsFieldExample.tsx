"use client";

import { useState } from "react";

import { FormCard } from "@/components/molecules/FormCard";
import type { RequiredItem } from "@/components/molecules/event-post/RequiredItemField";
import { RequiredItemField } from "@/components/molecules/event-post/RequiredItemField";

// 実フォームの「持ち物」ブロックと同じ構成の見本。
// チェック・入力はローカル状態に反映されるが、保存処理につながらないためどこにも送信されない。
export function ItemsFieldExample() {
  const [items, setItems] = useState<RequiredItem[]>([
    { itemName: "飲み物", isRequired: true },
    { itemName: "動きやすい服装", isRequired: false },
  ]);

  return (
    <div className="my-5">
      <FormCard
        title="持ち物"
        description="「必須」にチェックした持ち物は、参加者向けに強調表示されます。"
      >
        <RequiredItemField items={items} onItemsChange={setItems} />
      </FormCard>
    </div>
  );
}
