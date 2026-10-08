import { act, cleanup, render } from "@testing-library/react";
import { useLayoutEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventReportImageCarousel } from "@/components/molecules/event-detail/EventReportImageCarousel";

// next/image は jsdom では不要な処理が多いため、単純な img に置き換える。
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: テスト用のスタブ
    <img src={src} alt={alt} />
  ),
}));

// 活動レポートの画像カルーセルの表示枚数（デスクトップ3枚・モバイル1枚）は、最初の描画の確定時点
// （useLayoutEffect の時点）から画面幅に合っていなければならない。入力→プレビュー切替の位置合わせは
// useLayoutEffect で表示位置を測るため、最初の描画で1枚、後から3枚に変わると高さが変わり位置がずれる
// （再発防止テスト）。列の指定方法に依存しないよう、class 名ではなく表示された画像の枚数で確かめる。

const originalMatchMedia = window.matchMedia;

const stubMatchMedia = (matches: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
};

afterEach(() => {
  cleanup();
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia;
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
});

const countImages = () =>
  document.querySelectorAll('img[alt="レポート画像"]').length;

// 親の useLayoutEffect（切替時の位置合わせと同じタイミング）で表示中の画像の枚数を記録する。
function Page({ seen }: Readonly<{ seen: number[] }>) {
  const [shown, setShown] = useState(false);
  useLayoutEffect(() => {
    if (shown) {
      seen.push(countImages());
    }
  }, [shown, seen]);
  return (
    <div>
      <button type="button" onClick={() => setShown(true)}>
        表示
      </button>
      {shown ? (
        <EventReportImageCarousel images={["blob:a", "blob:b", "blob:c"]} />
      ) : null}
    </div>
  );
}

const showCarousel = () => {
  const seen: number[] = [];
  const view = render(<Page seen={seen} />);
  act(() => {
    view.getByText("表示").click();
  });
  return { seen, finalCount: countImages() };
};

describe("EventReportImageCarousel の表示枚数", () => {
  it("デスクトップ幅では、最初の描画の確定時点から3枚を表示する", () => {
    stubMatchMedia(true);

    const { seen, finalCount } = showCarousel();

    expect(seen[0]).toBe(3);
    expect(finalCount).toBe(3);
  });

  it("モバイル幅では、最初の描画の確定時点から1枚を表示する", () => {
    stubMatchMedia(false);

    const { seen, finalCount } = showCarousel();

    expect(seen[0]).toBe(1);
    expect(finalCount).toBe(1);
  });
});
