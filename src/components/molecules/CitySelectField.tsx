import { useMemo } from "react";

import { FormField } from "@/components/molecules/FormField";
import { SearchSelect } from "@/components/molecules/SearchSelect";
import { getCityGroup } from "@/utils/regionSearch";

// 市区町村入力欄のプロパティを定義
type CitySelectFieldProps = {
  id: string;
  // 選択中の都道府県。空なら市区町村を入力不可にする
  prefecture: string;
  value: string;
  onChange: (city: string) => void;
  error?: string;
};

// イベント作成フォームで使う市区町村の検索・選択入力欄。
// 都道府県が選択されるまで入力不可にする。
export function CitySelectField({
  id,
  prefecture,
  value,
  onChange,
  error,
}: Readonly<CitySelectFieldProps>) {
  const disabled = prefecture === "";
  const groups = useMemo(
    () => (prefecture ? [getCityGroup(prefecture)] : []),
    [prefecture],
  );

  return (
    <FormField id={id} label="市区町村" required error={error}>
      <SearchSelect
        id={id}
        value={value}
        groups={groups}
        disabled={disabled}
        onChange={(option) => onChange(option.name)}
        onClear={() => onChange("")}
        placeholder={`${prefecture}の市区町村を検索または選択`}
        disabledPlaceholder="都道府県を先に選んでください"
        emptyLabel="市区町村"
        error={Boolean(error)}
        ariaLabel="市区町村"
        showCount
      />
    </FormField>
  );
}
