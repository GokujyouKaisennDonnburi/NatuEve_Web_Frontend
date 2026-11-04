import { MOCK_SERVER_ORIGIN } from "@/mocks/constants";
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

let started = false;

// Next.js の instrumentation から開発時のみ呼び出す。
// Node.js には location が無いため、相対パスのハンドラを解決できるよう
// MSW の基準となるオリジンを設定する。
export function startMockServer() {
  if (started) return;

  if (
    typeof globalThis.location === "undefined" ||
    globalThis.location.href !== `${MOCK_SERVER_ORIGIN}/`
  ) {
    Object.defineProperty(globalThis, "location", {
      value: new URL(MOCK_SERVER_ORIGIN),
      configurable: true,
      writable: true,
    });
  }

  server.listen({ onUnhandledRequest: "bypass" });
  started = true;
}
