"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
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
          className="absolute left-[47px] right-[91px] top-1/2 -translate-y-1/2 h-[23px] border-0 bg-transparent p-0 text-[15px] leading-[22px] text-[#757575] placeholder:text-[#757575] shadow-none focus-visible:ring-0"
          autoComplete="off"
        />
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
