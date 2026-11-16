const whitespace = /\p{White_Space}/u;

export function validateNotificationText(raw: string, maxLength: number) {
  // Go の strings.TrimSpace と同じ空白だけを除く（JS の trim とは対象が異なる）。
  let start = 0;
  let end = raw.length;
  while (start < end && whitespace.test(raw[start])) start++;
  while (end > start && whitespace.test(raw[end - 1])) end--;
  const value = raw.slice(start, end);

  // 例えば「🌱」は HTML の maxLength では2文字分。API と同じく1コードポイントとして数える。
  let length = 0;
  for (const _ of value) {
    if (++length > maxLength) return { value, tooLong: true };
  }
  return { value, tooLong: false };
}
