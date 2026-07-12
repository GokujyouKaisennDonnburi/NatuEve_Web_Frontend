"use client";

import { useEffect, useState } from "react";
import { getTags } from "@/services/tag";
import type { TagItem } from "@/types/tag";

type UseTagsState = {
  tags: TagItem[];
  isLoading: boolean;
  error: Error | null;
};

export function useTags(): UseTagsState {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getTags()
      .then((response) => {
        if (!cancelled) {
          setTags(response.tags);
          setError(null);
        }
      })
      .catch((caught: Error) => {
        if (!cancelled) {
          setError(caught);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { tags, isLoading, error };
}
