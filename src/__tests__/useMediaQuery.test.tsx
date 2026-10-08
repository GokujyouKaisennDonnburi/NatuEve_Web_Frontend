import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "@/hooks/useMediaQuery";

const QUERY = "(min-width: 640px)";

// jsdom には window.matchMedia が無いため、マッチ状態と change の購読者を持つスタブに差し替える。
// テスト後は元の状態（未定義）へ戻す。
const originalMatchMedia = window.matchMedia;
let matches: boolean;
type Listener = (event: { matches: boolean }) => void;
let listeners: Set<Listener>;
let addCount: number;
let removeCount: number;

function setMatches(next: boolean) {
  matches = next;
  for (const listener of listeners) {
    listener({ matches: next });
  }
}

beforeEach(() => {
  matches = false;
  listeners = new Set();
  addCount = 0;
  removeCount = 0;
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        media: query,
        get matches() {
          return matches;
        },
        addEventListener: (_type: string, listener: Listener) => {
          addCount += 1;
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: Listener) => {
          removeCount += 1;
          listeners.delete(listener);
        },
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia;
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
});

// 描画のたびに返った値を記録する。最初の描画の値を確かめるため。
function Probe({ query, renders }: { query: string; renders: boolean[] }) {
  const value = useMediaQuery(query);
  renders.push(value);
  return <span>{String(value)}</span>;
}

describe("useMediaQuery", () => {
  it("クライアントで表示されるときは、最初の描画から実際の値を返す", () => {
    // effect で後から入れると最初の描画が false になり、表示直後にレイアウトが変わってしまう
    matches = true;
    const renders: boolean[] = [];

    render(<Probe query={QUERY} renders={renders} />);

    expect(renders[0]).toBe(true);
    expect(renders).not.toContain(false);
  });

  it("サーバー描画では false を返す", () => {
    matches = true;

    expect(renderToString(<Probe query={QUERY} renders={[]} />)).toContain(
      "false",
    );
  });

  it("マッチ状態が変わったら新しい値で描画し直す", () => {
    const renders: boolean[] = [];
    const { getByText } = render(<Probe query={QUERY} renders={renders} />);
    expect(getByText("false")).toBeInTheDocument();

    act(() => {
      setMatches(true);
    });

    expect(getByText("true")).toBeInTheDocument();
  });

  it("アンマウント時に購読を解除する", () => {
    const { unmount } = render(<Probe query={QUERY} renders={[]} />);
    expect(listeners.size).toBe(1);

    unmount();

    expect(listeners.size).toBe(0);
    expect(removeCount).toBe(addCount);
  });
});
