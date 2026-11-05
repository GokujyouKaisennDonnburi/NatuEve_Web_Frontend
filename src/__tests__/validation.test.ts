import { describe, expect, it } from "vitest";

import {
  getExternalUrlError,
  resolveSafeExternalUrl,
} from "@/utils/validation";

// 外部URLの検証基準（http/https・ホスト名あり）を投稿フォームと
// 外部遷移ボタンで共有しているため、その判定内容を検証する。
describe("getExternalUrlError", () => {
  it("空文字・空白のみは問題なし（null）を返す", () => {
    expect(getExternalUrlError("")).toBeNull();
    expect(getExternalUrlError("   ")).toBeNull();
  });

  it("http/https のURLは問題なし（null）を返す", () => {
    expect(getExternalUrlError("https://example.com/event")).toBeNull();
    expect(getExternalUrlError("http://example.com")).toBeNull();
  });

  it("http/https 以外のスキームは scheme を返す", () => {
    expect(getExternalUrlError("javascript:alert(1)")).toBe("scheme");
    expect(getExternalUrlError("ftp://example.com")).toBe("scheme");
    expect(getExternalUrlError("mailto:user@example.com")).toBe("scheme");
  });

  it("URLとして解釈できない文字列やホスト名なしは format を返す", () => {
    expect(getExternalUrlError("not a url")).toBe("format");
    expect(getExternalUrlError("https://")).toBe("format");
  });
});

describe("resolveSafeExternalUrl", () => {
  it("遷移に使えるURLを前後の空白を除いて返す", () => {
    expect(resolveSafeExternalUrl(" https://example.com/event ")).toBe(
      "https://example.com/event",
    );
  });

  it("未設定・空文字・null・undefined は null を返す", () => {
    expect(resolveSafeExternalUrl(undefined)).toBeNull();
    expect(resolveSafeExternalUrl(null)).toBeNull();
    expect(resolveSafeExternalUrl("")).toBeNull();
    expect(resolveSafeExternalUrl("   ")).toBeNull();
  });

  it("不正な文字列や危険なスキームは null を返す", () => {
    expect(resolveSafeExternalUrl("not a url")).toBeNull();
    expect(resolveSafeExternalUrl("javascript:alert(1)")).toBeNull();
  });
});
