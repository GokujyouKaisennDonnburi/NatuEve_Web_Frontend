// Node.js 用 MSW で相対パスのハンドラを解決するための固定オリジン。
// サーバー側の fetch はこのオリジンへ絶対 URL で送り、MSW が傍受する。
export const MOCK_SERVER_ORIGIN = "http://localhost:3000";
