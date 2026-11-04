import { describe, expect, it } from "vitest";
import { buildEventDescription, buildEventMetadata } from "@/utils/seo";

describe("buildEventMetadata", () => {
  it("イベント名を title、説明文を description に設定する", () => {
    const metadata = buildEventMetadata({
      title: "森と水の生き物観察ハイク",
      description: "自然観察を楽しみましょう。",
    });

    expect(metadata.title).toBe("森と水の生き物観察ハイク");
    expect(metadata.description).toBe("自然観察を楽しみましょう。");
  });

  it("イベントごとに異なる title / description を返す", () => {
    const first = buildEventMetadata({
      title: "イベントA",
      description: "説明A",
    });
    const second = buildEventMetadata({
      title: "イベントB",
      description: "説明B",
    });

    expect(first.title).not.toBe(second.title);
    expect(first.description).not.toBe(second.description);
  });

  it("説明文が長い場合は120文字に切り詰めて省略記号を付ける", () => {
    const metadata = buildEventMetadata({
      title: "タイトル",
      description: "あ".repeat(130),
    });

    expect(metadata.description).toBe(`${"あ".repeat(120)}…`);
  });

  it("説明文が空の場合は description を設定しない", () => {
    const metadata = buildEventMetadata({
      title: "タイトル",
      description: "   ",
    });

    expect(metadata.description).toBeUndefined();
  });
});

describe("buildEventDescription", () => {
  it("改行・連続空白を1つの空白に正規化する", () => {
    expect(buildEventDescription("  1行目\n\n2行目  ")).toBe("1行目 2行目");
  });
});
