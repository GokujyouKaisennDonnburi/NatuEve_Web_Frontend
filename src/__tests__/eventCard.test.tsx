import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventCard, type EventItem } from "@/components/organisms/EventCard";
import type { TagItem } from "@/types/tag";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: ReactNode } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  // EventCard は遷移中の読み込み表示に useLinkStatus を使う
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: テスト用のスタブ
    <img src={src} alt={alt} />
  ),
}));

const tags: TagItem[] = [
  { id: "tag-1", name: "野鳥観察" },
  { id: "tag-2", name: "とても長いタグ名のイベントタグ" },
  { id: "tag-3", name: "双眼鏡" },
];

const buildEvent = (tags?: TagItem[]): EventItem => ({
  id: "event-1",
  title: "テストイベント",
  eventDate: "2026-12-01T10:00:00+09:00",
  endDate: "2026-12-01T12:00:00+09:00",
  location: "東京都",
  profileId: "user-1",
  hostName: "主催者",
  hostAvatarUrl: "",
  tags,
  status: "open",
});

const makeRect = (width: number) => ({ width }) as DOMRect;

// jsdom はレイアウト計算を行わないため、矩形を実測値相当に差し替えて
// 「収まるタグの個数」の計算を再現する。
// タグ幅は 文字数 x 10 + 左右パディング 24px の近似値とする。
const stubRects = (containerWidth: number) =>
  vi
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: Element) {
      // タグ領域
      if (this.classList.contains("flex-wrap")) {
        return makeRect(containerWidth);
      }
      // FilterTag 本体と「+N」チップのラッパー(タグ領域の直下)
      if (this.parentElement?.classList.contains("flex-wrap")) {
        const text = this.textContent ?? "";
        return makeRect(text.length * 10 + 24);
      }
      return makeRect(0);
    });

// jsdom には window.matchMedia が無いため、マッチ状態を切り替えられるスタブに差し替える
const originalMatchMedia = window.matchMedia;
let smMatches = false;

beforeEach(() => {
  smMatches = false;
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        media: query,
        get matches() {
          return smMatches;
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia;
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
});

describe("EventCard のタグ表示", () => {
  it("スマホ幅では全件のタグを折り返して表示する", () => {
    stubRects(150);
    render(<EventCard event={buildEvent(tags)} />);

    for (const tag of tags) {
      expect(screen.getByText(tag.name)).toBeInTheDocument();
      expect(screen.getByTitle(tag.name)).toBeInTheDocument();
    }
    // 折り返し表示のため「+N」チップは使わない
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("sm 以上ではすべてのタグが収まる場合は全件を固定サイズで表示する", () => {
    smMatches = true;
    stubRects(500);
    render(<EventCard event={buildEvent(tags)} />);

    for (const tag of tags) {
      const label = screen.getByText(tag.name);
      expect(label).toBeInTheDocument();
      // FilterTag 本体は縮まず固定サイズ(shrink-0)
      expect(label.parentElement).toHaveClass("shrink-0");
      expect(screen.getByTitle(tag.name)).toBeInTheDocument();
    }
    // あふれていないので「+N」チップは表示しない
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("sm 以上で収まりきらないタグは「+N」チップにまとめられ、表示タグは固定サイズのままになる", () => {
    smMatches = true;
    stubRects(150);
    render(<EventCard event={buildEvent(tags)} />);

    // 1枚目のタグのみ表示し、残り 2 件は「+2」チップにまとめる
    expect(screen.getByText("野鳥観察")).toBeInTheDocument();
    expect(screen.queryByText(tags[1].name)).not.toBeInTheDocument();
    expect(screen.queryByText(tags[2].name)).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("sm 以上では表示中のタグと「+N」チップの title で、タグ名の全文を確認できる", () => {
    smMatches = true;
    stubRects(150);
    render(<EventCard event={buildEvent(tags)} />);

    expect(screen.getByTitle("野鳥観察")).toBeInTheDocument();
    expect(
      screen.getByTitle("とても長いタグ名のイベントタグ、双眼鏡"),
    ).toBeInTheDocument();
  });

  it("タグが設定されていないイベントカードでもレイアウトが崩れない", () => {
    smMatches = true;
    stubRects(150);
    render(<EventCard event={buildEvent(undefined)} />);

    expect(screen.getByText("テストイベント")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });
});
