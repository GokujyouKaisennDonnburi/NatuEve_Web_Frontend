"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useId, useState } from "react";

type SearchBarProps = {
  onSearch: (query: string) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  onSearch,
  initialValue = "",
  placeholder = "キーワード・主催者名・場所で探す（例: ホタル、干潟）",
  className = "",
}: Readonly<SearchBarProps>) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue);

  const submitSearch = () => {
    onSearch(value.trim());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
  };

  const clearInput = () => {
    setValue("");
  };

  return (
    <div
      className={cn(
        "flex items-center h-[54px] w-full bg-white border border-[#E3E8DF] shadow-[0px_1px_2px_rgba(39,46,36,0.05)] rounded-full",
        className,
      )}
    >
      <div className="relative flex-1 h-full">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-[19px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A8B1A2]"
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
          // right-[91px] は検索ボタン領域分の余白。テキストボックスが
          // 検索ボタンの下に重なるのを防ぎ、検索ボタンの判定を優先させる
          className="absolute left-[47px] right-[91px] top-1/2 -translate-y-1/2 h-[23px] border-0 bg-transparent p-0 text-[15px] leading-[22px] text-[#757575] placeholder:text-[#757575] shadow-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          autoComplete="off"
        />
        {value !== "" && (
          <button
            type="button"
            onClick={clearInput}
            aria-label="検索条件をクリア"
            className="absolute right-[91px] top-1/2 -translate-y-1/2 inline-flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#A8B1A2] text-white transition hover:bg-[#8A9484] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#97C459]/50"
          >
            <X className="h-[12px] w-[12px]" />
          </button>
        )}
      </div>
      <Button
        type="button"
        onClick={submitSearch}
        className="shrink-0 mr-[17px] h-[38px] px-6 bg-[#97C459] hover:bg-[#97C459]/90 rounded-full text-[15px] font-bold leading-[22px] text-[#1E2C10]"
      >
        検索
      </Button>
    </div>
  );
}
