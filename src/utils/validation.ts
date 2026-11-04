export function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function isRequired(value: string) {
  return value.trim().length > 0;
}

// 外部サイトへ遷移させられるURLかどうかを検証し、遷移に使えるURL文字列を返す。
// 投稿フォーム（report-post）と同じ基準（http/https・ホスト名あり）で判定する。
// 空文字やjavascript: などURLとして解釈できない不正値は null を返す。呼び出し側で
// null を「externalUrl 未設定と同じ扱い」にすると、不正値でも画面がクラッシュしない。
export function resolveSafeExternalUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.hostname
    ) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}
