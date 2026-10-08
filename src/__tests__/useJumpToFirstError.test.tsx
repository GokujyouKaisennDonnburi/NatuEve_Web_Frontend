import { cleanup, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useJumpToFirstError } from "@/hooks/useJumpToFirstError";

type Errors = Readonly<Record<string, unknown>>;

// フックの検証用に、エラー項目（data-field-error）と入力欄を並べた最小のコンポーネント。
// data-field-error は FormField と同じく、エラーがあるときだけ付ける。
function Harness({
  errors,
  hidden,
  withoutControl = false,
}: Readonly<{ errors: Errors; hidden?: boolean; withoutControl?: boolean }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  useJumpToFirstError(containerRef, errors, hidden);
  const mark = (key: string) => (key in errors ? "" : undefined);

  return (
    <div ref={containerRef}>
      <div data-field-error={mark("first")} data-testid="first-field">
        {withoutControl ? null : <input aria-label="first-input" />}
      </div>
      <div data-field-error={mark("second")} data-testid="second-field">
        <textarea aria-label="second-input" />
      </div>
    </div>
  );
}

// jsdom には Element.prototype.scrollIntoView が無いため、スタブして呼び出しを観測する。
// テスト後は元の状態（未定義）へ戻す。
const originalScrollIntoView = Element.prototype.scrollIntoView;
let scrollIntoView: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  cleanup();
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  }
});

function renderHarness(
  errors: Errors,
  hidden: boolean,
  withoutControl = false,
) {
  const view = render(
    <Harness errors={errors} hidden={hidden} withoutControl={withoutControl} />,
  );
  return {
    rerenderHarness: (nextErrors: Errors, nextHidden: boolean) =>
      view.rerender(
        <Harness
          errors={nextErrors}
          hidden={nextHidden}
          withoutControl={withoutControl}
        />,
      ),
  };
}

describe("useJumpToFirstError", () => {
  it("hidden=true の間はエラーがあってもジャンプしない", () => {
    renderHarness({ first: "必須です" }, true);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByLabelText("first-input")).not.toHaveFocus();
  });

  it("hidden が false になったら1回ジャンプし、エラー項目内の入力欄にフォーカスする", () => {
    const errors = { first: "必須です" };
    const { rerenderHarness } = renderHarness(errors, true);

    rerenderHarness(errors, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(screen.getByLabelText("first-input")).toHaveFocus();
  });

  it("同じ errors のまま hidden を往復してもジャンプは増えない", () => {
    const errors = { first: "必須です" };
    const { rerenderHarness } = renderHarness(errors, true);

    rerenderHarness(errors, false);
    rerenderHarness(errors, true);
    rerenderHarness(errors, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("新しい errors オブジェクトなら、同じ内容でも再びジャンプする", () => {
    const { rerenderHarness } = renderHarness({ first: "必須です" }, false);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerenderHarness({ first: "必須です" }, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("空の errors ではジャンプしない", () => {
    const { rerenderHarness } = renderHarness({}, false);
    rerenderHarness({}, false);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("エラー項目が複数あるときは、DOM の並び順で一番上へジャンプする", () => {
    // errors のキーの順ではなく、DOM の並び順で一番上の項目へ移る
    renderHarness({ second: "必須です", first: "必須です" }, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("first-input")).toHaveFocus();
    expect(screen.getByLabelText("second-input")).not.toHaveFocus();
  });

  it("入力欄を含まないエラー項目なら、その項目要素自体にスクロールする", () => {
    renderHarness({ first: "必須です" }, false, true);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    // scrollIntoView は vi.fn なので、this（スクロール対象）は mock.contexts で確認する
    expect(scrollIntoView.mock.contexts[0]).toBe(
      screen.getByTestId("first-field"),
    );
  });
});
