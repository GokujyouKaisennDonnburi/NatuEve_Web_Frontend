"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

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
  const inputId = "event-search-bar-input";
  const [value, setValue] = useState(initialValue);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearch(value.trim());
    }
  };

  return (
    <div className={`relative block ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
  );
}
