import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ReportPostForm,
  type ReportPostFormState,
} from "@/components/organisms/report-post/ReportPostForm";

const baseState: ReportPostFormState = {
  content: "",
  reportImages: [],
  externalUrlEnabled: false,
  externalUrl: "",
  reportPdfs: [],
};

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

function renderForm(
  validationErrors: Record<string, string>,
  hidden: boolean,
  formState: ReportPostFormState = baseState,
) {
  const build = (errors: Record<string, string>, isHidden: boolean) => (
    <ReportPostForm
      formState={formState}
      validationErrors={errors}
      setFormState={() => {}}
      onSubmit={() => {}}
      onCancel={() => {}}
      isSubmitting={false}
      hidden={isHidden}
    />
  );
  const view = render(build(validationErrors, hidden));
  return {
    container: view.container,
    rerenderForm: (nextErrors: Record<string, string>, nextHidden: boolean) =>
      view.rerender(build(nextErrors, nextHidden)),
  };
}

describe("ReportPostForm のエラー項目ジャンプ", () => {
  it("hidden のとき form が hidden 属性を持ち、エラーがあってもジャンプしない", () => {
    const { container } = renderForm({ content: "必須です" }, true);

    expect(container.querySelector("form")).toHaveAttribute("hidden");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("hidden が解除されたら、活動した記録の入力欄にフォーカスして1回ジャンプする", () => {
    const errors = { content: "必須です" };
    const { container, rerenderForm } = renderForm(errors, true);

    rerenderForm(errors, false);

    expect(container.querySelector("form")).not.toHaveAttribute("hidden");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(document.getElementById("content")).toHaveFocus();
  });

  it("外部URLが有効でそのエラーがあるとき、外部URLの入力欄にフォーカスする", () => {
    renderForm({ externalUrl: "URLが不正です" }, false, {
      ...baseState,
      externalUrlEnabled: true,
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.getElementById("external-url")).toHaveFocus();
    // 外部URL有効時は活動記録の入力欄が無い
    expect(screen.queryByLabelText(/活動した記録/)).toBeNull();
  });
});
