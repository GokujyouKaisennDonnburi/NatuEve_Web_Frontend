"use client";

import { FormCard } from "@/components/molecules/FormCard";
import { RequiredItemField } from "@/components/molecules/event-post/RequiredItemField";

// 実フォームの「持ち物」ブロックと同じ構成の見本。
// チェック・入力はできるが、onItemsChange に何も流れないため保存されない。
export function ItemsFieldExample() {
  return (
    <div className="my-5">
      <FormCard
        title="持ち物"
        description="「必須」にチェックした持ち物は、参加者向けに強調表示されます。"
      >
        <RequiredItemField
          items={[
            { itemName: "飲み物", isRequired: true },
            { itemName: "動きやすい服装", isRequired: false },
          ]}
          onItemsChange={() => {}}
        />
      </FormCard>
    </div>
  );
}
