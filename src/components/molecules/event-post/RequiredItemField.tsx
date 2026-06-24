import { Plus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RequiredItem = {
  itemName: string;
  isRequired: boolean;
};

type RequiredItemFieldProps = {
  items: RequiredItem[];
  onItemsChange: (items: RequiredItem[]) => void;
  errors?: Record<number, string>;
};

export function RequiredItemField({
  items,
  onItemsChange,
  errors,
}: Readonly<RequiredItemFieldProps>) {
  const fieldId = useId();

  const [rowIds, setRowIds] = useState<string[]>(() =>
    items.map(() => crypto.randomUUID()),
  );

  useEffect(() => {
    setRowIds((current) => {
      if (current.length === items.length) {
        return current;
      }

      if (current.length < items.length) {
        return [
          ...current,
          ...Array.from({ length: items.length - current.length }, () =>
            crypto.randomUUID(),
          ),
        ];
      }

      return current.slice(0, items.length);
    });
  }, [items.length]);

  const handleAddItem = () => {
    setRowIds((current) => [...current, crypto.randomUUID()]);
    onItemsChange([...items, { itemName: "", isRequired: true }]);
  };

  const handleRemoveItem = (index: number) => {
    setRowIds((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    onItemsChange(items.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleItemNameChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], itemName: value };
    onItemsChange(updated);
  };

  const handleRequiredChange = (index: number, checked: boolean) => {
    const updated = [...items];
    updated[index] = { ...updated[index], isRequired: checked };
    onItemsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={rowIds[index] ?? `${fieldId}-item-${index}`}
            className="flex items-start gap-3"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor={`${fieldId}-name-${index}`} className="sr-only">
                持ち物名
              </Label>
              <Input
                id={`${fieldId}-name-${index}`}
                value={item.itemName}
                onChange={(event) =>
                  handleItemNameChange(index, event.target.value)
                }
                placeholder="例: 飲み物"
                maxLength={255}
                className="text-sm"
              />
              {errors?.[index] ? (
                <p className="mt-1 text-xs text-red-600">{errors[index]}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2 self-center rounded-md border border-slate-200 bg-white px-3 py-2">
              <Checkbox
                id={`${fieldId}-required-${index}`}
                checked={item.isRequired}
                onCheckedChange={(checked) =>
                  handleRequiredChange(index, checked === true)
                }
              />
              <Label
                htmlFor={`${fieldId}-required-${index}`}
                className="cursor-pointer text-sm text-slate-700"
              >
                必須
              </Label>
            </div>

            <div className="flex items-center self-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemoveItem(index)}
                aria-label={`行${index + 1}を削除`}
                className="cursor-pointer text-red-600 hover:bg-transparent hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          持ち物は未設定です。必要な場合は下のボタンから追加してください。
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddItem}
        className="w-full text-sm"
      >
        <Plus className="h-4 w-4" />
        持ち物を追加
      </Button>
    </div>
  );
}
