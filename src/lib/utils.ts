import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// タグ名の照合用の正規化。全角半角（NFKC）と大文字小文字の違いを無視する。
// 候補の絞り込み（TagAutocomplete）と重複判定・409 リカバリの照合
// （TagInputField）で同じルールを使わないと、候補には出ないのに
// 重複扱いになるといった食い違いが起きるため、1 箇所にまとめている。
export function normalizeTagName(value: string) {
  return value.normalize("NFKC").toLowerCase();
}
