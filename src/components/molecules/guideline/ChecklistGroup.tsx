"use client";

import { useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ChecklistGroupProps = {
  title: string;
  items: readonly string[];
};

// 投稿前チェックリストの1グループ。
// チェックはローカル状態に反映されるが、保存処理につながらないためどこにも送信されない。
export function ChecklistGroup({
  title,
  items,
}: Readonly<ChecklistGroupProps>) {
  const groupId = useId();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  return (
    <div className="rounded-[14px] border border-[#DCE8C8] bg-[#FAFBF7] p-5">
      <h3 className="mb-3 text-lg font-bold text-[#2D401A]">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item, index) => {
          const itemId = `${groupId}-${index}`;
          return (
            <li
              key={item}
              className="flex items-start gap-3 text-base text-[#333]"
            >
              <Checkbox
                id={itemId}
                checked={checkedItems[item] === true}
                onCheckedChange={(checked) =>
                  setCheckedItems((prev) => ({
                    ...prev,
                    [item]: checked === true,
                  }))
                }
                className="mt-[5px] size-[18px] shrink-0 cursor-pointer rounded-[5px] border-2 data-[state=checked]:border-(--brand-green) data-[state=checked]:bg-(--brand-green) data-[state=checked]:text-white"
              />
              <Label
                htmlFor={itemId}
                className="cursor-pointer font-normal leading-[1.8] text-[#333]"
              >
                {item}
              </Label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
