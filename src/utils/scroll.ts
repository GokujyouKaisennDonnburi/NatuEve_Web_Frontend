// ページ最下部までスクロールしているか。端数で届かないことがあるため 2px の余裕を持たせる。
export const isScrolledToBottom = (): boolean =>
  window.innerHeight + window.scrollY >=
  document.documentElement.scrollHeight - 2;
