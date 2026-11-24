import type { ContactCategory } from "@/types/contact";

// お問い合わせフォームのカテゴリ選択肢。
// 値は NatuEve_API の model.ContactCategory（ADR-0052）と一致させる。
export const CONTACT_CATEGORIES = [
  { value: "request", label: "要望" },
  { value: "bug", label: "不具合報告" },
  { value: "other", label: "その他お問い合わせ" },
] as const satisfies readonly { value: ContactCategory; label: string }[];
