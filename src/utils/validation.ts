export function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function isRequired(value: string) {
  return value.trim().length > 0;
}

// 外部URLの形式判定。http/https・ホスト名ありの絶対URLのみを許可する。
// 投稿フォーム（event-post / report-post）と外部遷移ボタンで同じ基準を共有するため、
// URL形式の判定はここへ集約する。問題の種別を返すことで、
// 呼び出し側が個別のエラーメッセージを出せる（文字数チェックは呼び出し側に残す）。
export function getExternalUrlError(value: string): "scheme" | "format" | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "scheme";
    }
    if (!parsed.hostname) {
      return "format";
    }
    return null;
  } catch {
    return "format";
  }
}

// 外部サイトへ遷移させられるURLかどうかを検証し、遷移に使えるURL文字列を返す。
// 空文字やjavascript: などURLとして解釈できない不正値は null を返す。呼び出し側で
// null を「externalUrl 未設定と同じ扱い」にすると、不正値でも画面がクラッシュしない。
export function resolveSafeExternalUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return getExternalUrlError(trimmed) === null ? trimmed : null;
}
