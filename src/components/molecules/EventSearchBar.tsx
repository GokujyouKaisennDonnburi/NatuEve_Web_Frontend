"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useId, useState } from "react";

type EventSearchBarProps = {
  onSearch: (query: string) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
};

export function EventSearchBar({
  onSearch,
  initialValue = "",
  placeholder = "イベントを検索",
  className = "",
}: Readonly<EventSearchBarProps>) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue);

  // 検索を実行する関数
  const submitSearch = () => {
    onSearch(value.trim());
  };

  // Enter キー押下時に検索を実行するハンドラー
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 検索入力欄 */}
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <label htmlFor={inputId} className="sr-only">
          {placeholder}
        </label>
        <Input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10"
          autoComplete="off"
        />
      </div>

      {/* 検索ボタン */}
      <Button
        type="button"
        onClick={submitSearch}
        aria-label="検索を実行"
        size="icon"
        variant="ghost"
        className="shrink-0 h-9 px-5 bg-slate-900 text-white hover:bg-slate-700"
      >
        検索
      </Button>
    </div>
  );
}
