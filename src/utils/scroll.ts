// ページ最下部までスクロールしているか。端数で届かないことがあるため 2px の余裕を持たせる。
// 目次（PageToc）の現在地と表示切替時の位置合わせ（scrollSync）で、同じ判定を使う。
export const isScrolledToBottom = (): boolean =>
  window.innerHeight + window.scrollY >=
  document.documentElement.scrollHeight - 2;
