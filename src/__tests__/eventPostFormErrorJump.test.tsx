import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventPostForm } from "@/components/organisms/event-post/EventPostForm";
import type {
  EventPostFormErrors,
  EventPostFormState,
} from "@/hooks/useEventPostForm";

// TagInputField が useTags / useCreateTag 経由で呼ぶ API を差し替え、実 API を叩かない。
vi.mock("@/services/tag", () => ({
  createTag: vi.fn(),
  getTags: vi.fn().mockResolvedValue({ tags: [] }),
}));

const formState: EventPostFormState = {
  eventName: "",
  eventContent: "",
  eventImage: null,
  eventDocuments: [],
  prefecture: "",
  city: "",
  address: "",
  eventDateTime: "",
  endDateTime: "",
  feeCategoryGroups: [{ category: "", amount: "" }],
  capacity: "",
  applicationDeadline: "",
  applicationUrl: "",
  requiredItems: [],
  tags: [],
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

function renderForm(errors: EventPostFormErrors, hidden: boolean) {
  const view = render(
    <EventPostForm
      formState={formState}
      errors={errors}
      setField={() => {}}
      hidden={hidden}
    />,
  );
  return {
    rerenderForm: (nextErrors: EventPostFormErrors, nextHidden: boolean) =>
      view.rerender(
        <EventPostForm
          formState={formState}
          errors={nextErrors}
          setField={() => {}}
          hidden={nextHidden}
        />,
      ),
  };
}

// エラー項目のジャンプ先になる、イベントタイトルの入力欄
const getTitleInput = () => screen.getByLabelText(/イベントタイトル/);

describe("EventPostForm のエラー項目ジャンプ", () => {
  it("hidden のままエラーがあってもジャンプしない", () => {
    renderForm({ eventName: "必須です" }, true);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("hidden が解除されたら1回ジャンプし、エラー項目にフォーカスする", () => {
    const errors = { eventName: "必須です" };
    const { rerenderForm } = renderForm(errors, true);

    rerenderForm(errors, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(getTitleInput()).toHaveFocus();
  });

  it("同じ errors のまま hidden を往復してもジャンプは増えない", () => {
    const errors = { eventName: "必須です" };
    const { rerenderForm } = renderForm(errors, true);

    rerenderForm(errors, false);
    rerenderForm(errors, true);
    rerenderForm(errors, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("新しい errors オブジェクトなら、同じ内容でも再びジャンプする", () => {
    const { rerenderForm } = renderForm({ eventName: "必須です" }, false);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerenderForm({ eventName: "必須です" }, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("エラーが複数あるときは、画面で一番上のエラー項目へジャンプする", () => {
    // errors のキーの順ではなく、画面（DOM）の並び順で一番上のタイトルへ移る
    renderForm({ eventContent: "必須です", eventName: "必須です" }, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(getTitleInput()).toHaveFocus();
  });

  it("hidden が解除された状態でエラーが来たら、すぐ1回ジャンプする", () => {
    const { rerenderForm } = renderForm({}, false);
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerenderForm({ eventName: "必須です" }, false);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(getTitleInput()).toHaveFocus();
  });
});
