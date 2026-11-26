import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTagOverflowCount } from "@/hooks/useTagOverflowCount";
import type { TagItem } from "@/types/tag";

const tags: TagItem[] = [
  { id: "tag-1", name: "野鳥観察" },
  { id: "tag-2", name: "とても長いタグ名のイベントタグ" },
  { id: "tag-3", name: "双眼鏡" },
];

const makeRect = (width: number) => ({ width }) as DOMRect;

// jsdom はレイアウト計算を行わないため、矩形を実測値相当に差し替える。
// タグ幅は 文字数 x 10 + 左右パディング 24px の近似値とする。
const stubRects = (containerWidth: number) =>
  vi
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: Element) {
      if (this.classList.contains("flex-wrap")) {
        return makeRect(containerWidth);
      }
      if (this.parentElement?.classList.contains("flex-wrap")) {
        const labelElement = this.firstElementChild ?? this;
        const text = labelElement.textContent ?? "";
        return makeRect(text.length * 10 + 24);
      }
      return makeRect(0);
    });

afterEach(() => {
  vi.restoreAllMocks();
});

type HarnessProps = {
  tags: TagItem[];
  enabled: boolean;
};

// フックの戻り値をそのまま描画する薄いハーネス
function Harness({ tags, enabled }: Readonly<HarnessProps>) {
  const { visibleCount, rowRef, chipRef } = useTagOverflowCount(tags, {
    enabled,
    gapPx: 4,
  });
  const visibleTags =
    visibleCount === null ? tags : tags.slice(0, visibleCount);
  const hiddenTags = tags.slice(visibleTags.length);

  return (
    <div>
      <span data-testid="visible-count">
        {visibleCount === null ? "all" : String(visibleCount)}
      </span>
      <div ref={rowRef} className="flex flex-wrap">
        {visibleTags.map((tag) => (
          <span key={tag.id} className="shrink-0">
            <span>{tag.name}</span>
          </span>
        ))}
        {hiddenTags.length > 0 && (
          <span ref={chipRef}>
            <span>{`+${hiddenTags.length}`}</span>
          </span>
        )}
      </div>
    </div>
  );
}

describe("useTagOverflowCount", () => {
  it("全タグが収まる場合は全件表示を表す null を返す", () => {
    stubRects(500);
    render(<Harness tags={tags} enabled />);

    expect(screen.getByTestId("visible-count")).toHaveTextContent("all");
  });

  it("収まりきらない場合は収まる個数を返す", () => {
    stubRects(150);
    render(<Harness tags={tags} enabled />);

    expect(screen.getByTestId("visible-count")).toHaveTextContent("1");
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("enabled が false の間は全件表示のまま計測しない", () => {
    stubRects(150);
    render(<Harness tags={tags} enabled={false} />);

    expect(screen.getByTestId("visible-count")).toHaveTextContent("all");
    expect(screen.queryByText("+2")).not.toBeInTheDocument();
  });
});
