import { Plus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  // 各行のIDを管理する状態。行の追加や削除に対応するため、items の長さに応じて動的に更新される。
  const [rowIds, setRowIds] = useState<string[]>(() =>
    items.map(() => crypto.randomUUID()),
  );

  // items の長さが変わったときに rowIds を更新するエフェクト。行の追加や削除に対応するため、items の長さに応じて rowIds を動的に更新する。
  useEffect(() => {
    // items の長さに応じて rowIds を更新する。
    setRowIds((current) => {
      // items の長さと現在の rowIds の長さが同じ場合はそのまま返す。
      if (current.length === items.length) {
        return current;
      }

      // items の長さより rowIds の長さが短い場合は、足りない分のIDを生成して追加する。items の長さより rowIds の長さが長い場合は、余分なIDを削除する。
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

  // 行を追加する処理。新しい行を追加するときに、rowIds に新しいIDを追加し、items に新しい価格カテゴリを追加する。
  const handleAddItem = () => {
    setRowIds((current) => [...current, crypto.randomUUID()]);
    onItemsChange([...items, { category: "", amount: "" }]);
  };

  // 行を削除する処理。行を削除するときに、rowIds から該当するIDを削除し、items から該当する価格カテゴリを削除する。
  const handleRemoveItem = (index: number) => {
    setRowIds((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
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
            {/* カテゴリの入力欄を表示する部分。エラーがある場合はエラーメッセージも表示される。 */}
            <div className="flex-1">
              <Label
                htmlFor={`${fieldId}-category-${index}`}
                className="sr-only"
              >
                カテゴリ
              </Label>
              <Input
                id={`${fieldId}-category-${index}`}
                value={item.category}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                placeholder="例: 高校生"
                className="text-sm"
              />
              {errors?.[index] && (
                <p className="mt-1 text-xs text-red-600">{errors[index]}</p>
              )}
            </div>

            {/* 金額の入力欄を表示する部分。全角数字を半角数字に変換して入力を受け付ける。 */}
            <div className="flex-1">
              <Label htmlFor={`${fieldId}-amount-${index}`} className="sr-only">
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

            {/* 行を削除するボタンを表示する部分。行が1つしかない場合は削除できないようにする。 */}
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
