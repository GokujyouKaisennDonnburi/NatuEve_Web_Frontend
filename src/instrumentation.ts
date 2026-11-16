// 開発時のみ Node.js 用の MSW を起動し、Server Component の fetch もモックする。
// Cloudflare Workers（OpenNext）では Node.js 用 MSW が動かないため、
// development かつ nodejs ランタイムに限定する。
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "development") return;
  if (process.env.NEXT_PUBLIC_USE_MSW !== "true") return;

  const { startMockServer } = await import("@/mocks/server");
  startMockServer();
}
