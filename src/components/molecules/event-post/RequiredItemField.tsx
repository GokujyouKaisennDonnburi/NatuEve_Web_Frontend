"use client";

import { useId } from "react";

import { AddItemButton } from "@/components/atoms/AddItemButton";
import { DeleteIconButton } from "@/components/atoms/DeleteIconButton";
import { FieldNote } from "@/components/atoms/FieldNote";
import { FormEmptyBox } from "@/components/atoms/FormEmptyBox";
import { FormInput } from "@/components/atoms/FormInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MAX_TEXT_LENGTH } from "@/constants/config";
import { useRowIds } from "@/hooks/useRowIds";

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

  const { rowIds, addRowId, removeRowId } = useRowIds(items.length);

  const handleAddItem = () => {
    addRowId();
    onItemsChange([...items, { itemName: "", isRequired: true }]);
  };

  const handleRemoveItem = (index: number) => {
    removeRowId(index);
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
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor={`${fieldId}-name-${index}`} className="sr-only">
                持ち物名
              </Label>
              <FormInput
                id={`${fieldId}-name-${index}`}
                value={item.itemName}
                onChange={(event) =>
                  handleItemNameChange(index, event.target.value)
                }
                placeholder="例: 飲み物"
                maxLength={MAX_TEXT_LENGTH}
                aria-invalid={Boolean(errors?.[index])}
              />
              {errors?.[index] ? (
                <FieldNote tone="error">{errors[index]}</FieldNote>
              ) : null}
            </div>

            <div className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-(--form-border) bg-white px-3">
              <Checkbox
                id={`${fieldId}-required-${index}`}
                checked={item.isRequired}
                onCheckedChange={(checked) =>
                  handleRequiredChange(index, checked === true)
                }
                className="cursor-pointer data-[state=checked]:border-(--brand-green) data-[state=checked]:bg-(--brand-green) data-[state=checked]:text-white"
              />
              <Label
                htmlFor={`${fieldId}-required-${index}`}
                className="cursor-pointer text-sm text-slate-600"
              >
                必須
              </Label>
            </div>

            <DeleteIconButton
              onClick={() => handleRemoveItem(index)}
              label={`${index + 1}行目の持ち物を削除`}
            />
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <FormEmptyBox>
          持ち物は未設定です。必要な場合は下のボタンから追加してください。
        </FormEmptyBox>
      ) : null}

      <AddItemButton onClick={handleAddItem}>持ち物を追加</AddItemButton>
    </div>
  );
}
