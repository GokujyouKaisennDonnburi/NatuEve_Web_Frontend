import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals: false 環境では自動 cleanup が効かないため、テスト毎に明示的に解放する
afterEach(() => {
  cleanup();
});
