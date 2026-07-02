// 相対パスの添付ファイルURLを、表示用にそのまま使える形式へ正規化する。
export const normalizeAssetUrl = (url: string): string => {
  // URL が空文字列の場合は、空文字列を返す。
  if (!url) {
    return "";
  }

  // 先頭のスラッシュを除去して正規化する。
  if (url.startsWith("/") || url.startsWith("//") || /^https?:\/\//.test(url)) {
    return url;
  }

  // それ以外の相対パスは、先頭にスラッシュを付与して返す。
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)) {
    return "";
  }

  return `/${url}`;
};
