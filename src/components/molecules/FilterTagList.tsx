"use client";

import { FilterTag } from "@/components/atoms/FilterTag";
import type { TagItem } from "@/types/tag";

type FilterTagListProps = {
  tags: TagItem[];
  selectedIds?: string[];
  onSelect?: (id: string) => void;
};

export function FilterTagList({
  tags,
  selectedIds = [],
  onSelect,
}: Readonly<FilterTagListProps>) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="フィルタータグ">
      {tags.map((tag) => (
        <li key={tag.id}>
          <FilterTag
            label={tag.name}
            selected={selectedIds.includes(tag.id)}
            onClick={onSelect ? () => onSelect(tag.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
