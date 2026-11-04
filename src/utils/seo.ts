import type { EventDetailResponse } from "@/types/event";
import type { Metadata } from "next";

const DESCRIPTION_MAX_LENGTH = 120;

// メタディスクリプション用に、説明文の改行・連続空白を1つの空白へ正規化し、
// 長すぎる場合は冒頭のみを切り出す。
export function buildEventDescription(description: string): string | undefined {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.length > DESCRIPTION_MAX_LENGTH
    ? `${normalized.slice(0, DESCRIPTION_MAX_LENGTH)}…`
    : normalized;
}

// イベントごとの title / description を組み立てる。
export function buildEventMetadata(
  event: Pick<EventDetailResponse, "title" | "description">,
): Metadata {
  const description = buildEventDescription(event.description);

  return {
    title: event.title,
    ...(description ? { description } : {}),
  };
}
