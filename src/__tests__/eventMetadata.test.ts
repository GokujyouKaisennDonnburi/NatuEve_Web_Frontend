import { describe, expect, it } from "vitest";
import { buildEventDescription, buildEventMetadata } from "@/utils/seo";

const baseEvent = {
  id: "event-1",
  title: "タイトル",
  description: "説明",
  imageUrls: [],
};

describe("buildEventMetadata", () => {
  it("イベント名を title、説明文を description に設定する", () => {
    const metadata = buildEventMetadata({
      ...baseEvent,
      title: "森と水の生き物観察ハイク",
      description: "自然観察を楽しみましょう。",
    });

    expect(metadata.title).toBe("森と水の生き物観察ハイク");
    expect(metadata.description).toBe("自然観察を楽しみましょう。");
  });

  it("イベントごとに異なる title / description を返す", () => {
    const first = buildEventMetadata({
      ...baseEvent,
      title: "イベントA",
      description: "説明A",
    });
    const second = buildEventMetadata({
      ...baseEvent,
      title: "イベントB",
      description: "説明B",
    });

    expect(first.title).not.toBe(second.title);
    expect(first.description).not.toBe(second.description);
  });

  it("説明文が長い場合は省略記号込みで120文字に切り詰める", () => {
    const metadata = buildEventMetadata({
      ...baseEvent,
      title: "タイトル",
      description: "あ".repeat(130),
    });

    expect(metadata.description).toBe(`${"あ".repeat(119)}…`);
  });

  it("説明文が空の場合は description を設定しない", () => {
    const metadata = buildEventMetadata({
      ...baseEvent,
      title: "タイトル",
      description: "   ",
    });

    expect(metadata.description).toBeUndefined();
  });
});

describe("buildEventMetadata の OGP", () => {
  it("イベント名・説明文の冒頭・先頭の画像を出力する", () => {
    const { openGraph } = buildEventMetadata({
      ...baseEvent,
      title: "森と水の生き物観察ハイク",
      description: "自然観察を\n楽しみましょう。",
      imageUrls: [
        "https://assets.natuportal.org/natueve/events/images/first.jpg",
        "https://assets.natuportal.org/natueve/events/images/second.jpg",
      ],
    });

    expect(openGraph?.title).toBe("森と水の生き物観察ハイク");
    expect(openGraph?.description).toBe("自然観察を 楽しみましょう。");
    expect(openGraph?.images).toEqual([
      {
        url: "https://assets.natuportal.org/natueve/events/images/first.jpg",
        alt: "森と水の生き物観察ハイク",
      },
    ]);
  });

  // 子の openGraph は親を置き換えるため、サイト共通の値と og:url も含める。
  it("サイト共通の OGP と og:url を引き継ぐ", () => {
    const { openGraph } = buildEventMetadata({ ...baseEvent, id: "a/b" });

    expect(openGraph).toMatchObject({
      siteName: "なちゅいべ",
      locale: "ja_JP",
      type: "website",
      url: "/event/a%2Fb",
    });
  });

  it("canonical と og:url を API の ID にそろえる", () => {
    const { alternates, openGraph } = buildEventMetadata({
      ...baseEvent,
      id: "a/b",
    });

    expect(alternates?.canonical).toBe("/event/a%2Fb");
    expect(openGraph?.url).toBe(alternates?.canonical);
  });

  it("画像がない場合は既定の OGP 画像を出力する", () => {
    const { openGraph } = buildEventMetadata(baseEvent);

    expect(openGraph?.images).toEqual([
      expect.objectContaining({ url: "/images/og-default.png" }),
    ]);
  });

  // 型上は必須だが、API の契約が崩れてもページ全体を 500 にしない。
  it("API が imageUrls を返さない場合も既定の OGP 画像を出力する", () => {
    const { openGraph } = buildEventMetadata({
      ...baseEvent,
      imageUrls: undefined as unknown as string[],
    });

    expect(openGraph?.images).toEqual([
      expect.objectContaining({ url: "/images/og-default.png" }),
    ]);
  });

  // HTML では Next.js がサイト共通の説明文で補う。
  it("説明文が空の場合は戻り値に og:description を含めない", () => {
    const { openGraph } = buildEventMetadata({
      ...baseEvent,
      description: "   ",
    });

    expect(openGraph).not.toHaveProperty("description");
  });

  // 公開ページのため、layout の設定を上書きして noindex にしない（#372）。
  it("robots を設定しない", () => {
    expect(buildEventMetadata(baseEvent)).not.toHaveProperty("robots");
  });
});

describe("buildEventDescription", () => {
  it("改行・連続空白を1つの空白に正規化する", () => {
    expect(buildEventDescription("  1行目\n\n2行目  ")).toBe("1行目 2行目");
  });

  it("絵文字などの surrogate pair を分割しない", () => {
    const result = buildEventDescription("😀".repeat(130));

    expect(result).toBe(`${"😀".repeat(119)}…`);
  });

  it("ZWJ 絵文字を分割しない", () => {
    const family = "👨‍👩‍👧‍👦";
    const result = buildEventDescription(family.repeat(130));

    expect(result).toBe(`${family.repeat(119)}…`);
  });

  it("結合文字を分割しない", () => {
    const combined = "か\u3099";
    const result = buildEventDescription(combined.repeat(130));

    expect(result).toBe(`${combined.repeat(119)}…`);
  });
});
