import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

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

// タグ領域(タグを並べる flex コンテナ)を取得する
const getTagsRow = () => {
  const firstTag = screen.getByText(tags[0].name);
  // FilterTag の内側 span → FilterTag 本体 → タグ領域
  return firstTag.parentElement?.parentElement as HTMLElement;
};

describe("EventCard のタグ表示", () => {
  it("タグ領域は折り返しなしで 1 行に収まる", () => {
    render(<EventCard event={buildEvent(tags)} />);

    const tagsRow = getTagsRow();
    expect(tagsRow).toHaveClass("flex-nowrap");
    expect(tagsRow).not.toHaveClass("flex-wrap");
  });

  it("カード幅に入りきらないタグは truncate クラスで ... 省略される", () => {
    render(<EventCard event={buildEvent(tags)} />);

    for (const tag of tags) {
      // FilterTag 本体と内側ラベルの両方が省略の前提クラスを持つ
      const label = screen.getByText(tag.name);
      expect(label).toHaveClass("truncate");
      expect(label.parentElement).toHaveClass("truncate");
    }
  });

  it("タグにホバーすると title 属性で全文を確認できる", () => {
    render(<EventCard event={buildEvent(tags)} />);

    for (const tag of tags) {
      expect(screen.getByTitle(tag.name)).toBeInTheDocument();
    }
  });

  it("タグが設定されていないイベントカードでもレイアウトが崩れない", () => {
    render(<EventCard event={buildEvent(undefined)} />);

    expect(screen.getByText("テストイベント")).toBeInTheDocument();
    expect(screen.queryByText(tags[0].name)).not.toBeInTheDocument();
  });
});
