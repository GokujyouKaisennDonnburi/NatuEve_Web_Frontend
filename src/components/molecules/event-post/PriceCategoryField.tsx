import { Plus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PriceCategory = {
  category: string;
  amount: string;
};

type PriceCategoryFieldProps = {
  items: PriceCategory[];
  onItemsChange: (items: PriceCategory[]) => void;
  errors?: Record<number, string>;
};

export function PriceCategoryField({
  items,
  onItemsChange,
  errors,
}: Readonly<PriceCategoryFieldProps>) {
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
    onItemsChange([...items, { category: "", amount: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setRowIds((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], category: value };
    onItemsChange(updated);
  };

  const handleAmountChange = (index: number, value: string) => {
    const normalizedValue = value
      .replace(/[０-９]/g, (character) =>
        String.fromCharCode(character.charCodeAt(0) - 0xfee0),
      )
      .replace(/[^0-9]/g, "");

    const updated = [...items];
    updated[index] = { ...updated[index], amount: normalizedValue };
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
            <div className="flex-1">
              <Label htmlFor={`category-${index}`} className="sr-only">
                カテゴリ
              </Label>
              <Input
                id={`category-${index}`}
                value={item.category}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                placeholder="例: 高校生"
                className="text-sm"
              />
              {errors?.[index] && (
                <p className="mt-1 text-xs text-red-600">{errors[index]}</p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor={`amount-${index}`} className="sr-only">
                金額
              </Label>
              <Input
                id={`amount-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={item.amount}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="例: 1000"
                className="text-sm"
              />
            </div>
            <div className="flex items-center self-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemoveItem(index)}
                disabled={items.length === 1}
                aria-label={`行${index + 1}を削除`}
                className="cursor-pointer text-red-600 hover:bg-transparent hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddItem}
        className="w-full text-sm"
      >
        <Plus className="h-4 w-4" />
        カテゴリを追加
      </Button>
    </div>
  );
}
