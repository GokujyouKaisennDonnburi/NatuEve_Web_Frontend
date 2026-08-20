export function formatDate(date: Date, locale = "ja-JP") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// RFC3339 の日時文字列を「8月11日 19:00」形式へ整形する。
// 申し込みモーダルのヘッダーなど、年を省いて簡潔に見せたい箇所で使う。
// 空文字や不正な日時の場合は「—」を返す。
export function formatMonthDayTime(value: string, locale = "ja-JP") {
  if (!value.trim()) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(parsed);
}

// RFC3339 の日時文字列を「2026年8月10日 19:00」形式へ整形する。
// 申し込み内容モーダルの一覧など、年まで含めて正確に見せたい箇所で使う。
// 空文字や不正な日時の場合は「—」を返す。
export function formatFullDateTime(value: string, locale = "ja-JP") {
  if (!value.trim()) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(parsed);
}
