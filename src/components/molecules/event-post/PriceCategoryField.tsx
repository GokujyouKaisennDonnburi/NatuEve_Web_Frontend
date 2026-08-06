import { useId } from "react";

import { AddItemButton } from "@/components/atoms/AddItemButton";
import { DeleteIconButton } from "@/components/atoms/DeleteIconButton";
import { FieldNote } from "@/components/atoms/FieldNote";
import { FormInput } from "@/components/atoms/FormInput";
import { UnitInput } from "@/components/molecules/UnitInput";
import { Label } from "@/components/ui/label";
import { useRowIds } from "@/hooks/useRowIds";
import { normalizeHalfWidthDigits } from "@/utils/format";

// 価格カテゴリの入力欄を表示するコンポーネントのプロパティを定義
export type PriceCategory = {
  category: string;
  amount: string;
};

// 価格カテゴリの入力欄を表示するコンポーネント
type PriceCategoryFieldProps = {
  items: PriceCategory[];
  onItemsChange: (items: PriceCategory[]) => void;
  errors?: Record<number, string>;
};

// 価格カテゴリの入力欄を表示するコンポーネント
export function PriceCategoryField({
  items,
  onItemsChange,
  errors,
}: Readonly<PriceCategoryFieldProps>) {
  const fieldId = useId(); // コンポーネントの一意なIDを生成するためのフック

  // 各行のIDを管理する。行の追加や削除に対応するため、items の長さに応じて動的に更新される。
  const { rowIds, addRowId, removeRowId } = useRowIds(items.length);

  // 行を追加する処理。新しい行を追加するときに、rowIds に新しいIDを追加し、items に新しい価格カテゴリを追加する。
  const handleAddItem = () => {
    addRowId();
    onItemsChange([...items, { category: "", amount: "" }]);
  };

  // 行を削除する処理。行を削除するときに、rowIds から該当するIDを削除し、items から該当する価格カテゴリを削除する。
  const handleRemoveItem = (index: number) => {
    removeRowId(index);
    onItemsChange(items.filter((_, i) => i !== index));
  };

  // カテゴリの値が変更されたときの処理。items の該当する価格カテゴリの category プロパティを更新する。
  const handleCategoryChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], category: value };
    onItemsChange(updated);
  };

  // 金額の値が変更されたときの処理。入力された値を全角数字から半角数字に変換し、items の該当する価格カテゴリの amount プロパティを更新する。
  const handleAmountChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      amount: normalizeHalfWidthDigits(value),
    };
    onItemsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={rowIds[index] ?? `${fieldId}-item-${index}`}
            className="space-y-2"
          >
            <div className="flex items-start gap-3">
              {/* カテゴリの入力欄を表示する部分。 */}
              <div className="min-w-0 flex-[3]">
                <Label
                  htmlFor={`${fieldId}-category-${index}`}
                  className="sr-only"
                >
                  カテゴリ
                </Label>
                <FormInput
                  id={`${fieldId}-category-${index}`}
                  value={item.category}
                  onChange={(e) => handleCategoryChange(index, e.target.value)}
                  placeholder="例: 高校生"
                  aria-invalid={Boolean(errors?.[index])}
                />
              </div>

              {/* 金額の入力欄を表示する部分。全角数字を半角数字に変換して入力を受け付ける。 */}
              <div className="min-w-0 flex-[2]">
                {/* 単位「円」は装飾のため、読み上げ用のラベル側に単位を含める */}
                <Label
                  htmlFor={`${fieldId}-amount-${index}`}
                  className="sr-only"
                >
                  金額（円）
                </Label>
                <UnitInput
                  id={`${fieldId}-amount-${index}`}
                  unit="円"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={item.amount}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                  placeholder="0"
                  className="text-right"
                  aria-invalid={Boolean(errors?.[index])}
                />
              </div>

              {/* 行を削除するボタンを表示する部分。参加費用は1件以上必須のため、1件のときは無効にする */}
              <DeleteIconButton
                onClick={() => handleRemoveItem(index)}
                label={`${index + 1}行目の参加費用を削除`}
                disabled={items.length <= 1}
              />
            </div>

            {errors?.[index] ? (
              <FieldNote tone="error">{errors[index]}</FieldNote>
            ) : null}
          </div>
        ))}
      </div>

      <AddItemButton onClick={handleAddItem}>項目を追加</AddItemButton>
    </div>
  );
}
