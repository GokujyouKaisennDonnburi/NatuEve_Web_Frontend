"use client";

import { useMemo } from "react";

import { FormField } from "@/components/molecules/FormField";
import { SearchSelect } from "@/components/molecules/SearchSelect";
import { getPrefectureGroups } from "@/utils/regionSearch";

// 都道府県入力欄のプロパティを定義
type PrefectureSelectFieldProps = {
  id: string;
  value: string;
  onChange: (prefecture: string) => void;
  error?: string;
};

// イベント作成フォームで使う都道府県の検索・選択入力欄。
// regions.ts の地域グループをそのまま候補リストの見出しに使う。
export function PrefectureSelectField({
  id,
  value,
  onChange,
  error,
}: Readonly<PrefectureSelectFieldProps>) {
  const groups = useMemo(() => getPrefectureGroups(), []);

  return (
    <FormField id={id} label="都道府県" required error={error}>
      <SearchSelect
        id={id}
        value={value}
        groups={groups}
        onChange={(option) => onChange(option.name)}
        onClear={() => onChange("")}
        placeholder="都道府県を検索または選択"
        emptyLabel="都道府県"
        error={Boolean(error)}
        ariaLabel="都道府県"
      />
    </FormField>
  );
}
