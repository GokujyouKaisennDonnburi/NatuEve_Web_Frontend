import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormEvent } from "react";

import { EventPostForm } from "@/components/organisms/event-post/EventPostForm";
import { useEventPostForm } from "@/hooks/useEventPostForm";
import type { EventPostFormState } from "@/hooks/useEventPostForm";
import { createEvent } from "@/services/event";

// イベント投稿フォームの「申し込みURL × 定員」の連動仕様を検証する。
// - 申し込みURL の入力がある間は定員を受け付けない（入力欄を無効化）
// - 申し込みURL の入力時点で入力済みの定員と定員エラーを自動クリア
// - 送信時、申し込みURL 設定時は capacity を payload に含めない

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/services/event", () => ({
  createEvent: vi.fn().mockResolvedValue(undefined),
}));

// 送信フローで呼ばれるアップロードを、ファイルなし扱いの返り値へ差し替える。
vi.mock("@/services/upload", () => ({
  uploadFile: vi.fn().mockResolvedValue(null),
  uploadFiles: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/molecules/CompletionToast", () => ({
  showCompletionToast: vi.fn(),
}));

const mockCreateEvent = vi.mocked(createEvent);

const submitEvent = {
  preventDefault: () => {},
} as unknown as FormEvent<HTMLFormElement>;

// 送信が通る最低限の入力を揃える。定員・申し込みURL はテストごとに上書きする。
const fillBaseFields = (
  setField: ReturnType<typeof useEventPostForm>["setField"],
) => {
  act(() => {
    setField("eventName", "テストイベント");
    setField("eventContent", "イベント概要です。");
    setField("prefecture", "東京都");
    setField("city", "千代田区");
    setField("eventDateTime", "2026-12-01T10:00");
    setField("endDateTime", "2026-12-01T12:00");
    setField("feeCategoryGroups", [{ category: "大人", amount: "1000" }]);
    setField("tags", [{ id: "tag-1", name: "自然" }]);
  });
};

describe("useEventPostForm の申し込みURL × 定員の連動", () => {
  beforeEach(() => {
    mockCreateEvent.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("申し込みURLの入力時点で入力済みの定員と定員エラーが自動クリアされる", async () => {
    const { result } = renderHook(() => useEventPostForm());

    act(() => {
      result.current.setField("capacity", "abc");
    });
    // 定員のエラーを出すために一度送信する（他の必須項目も未入力なので capacity のみ検証）
    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });
    expect(result.current.errors.capacity).toBe(
      "定員数は0以上の整数で入力してください。",
    );

    act(() => {
      result.current.setField("applicationUrl", "https://example.com/apply");
    });

    expect(result.current.formState.capacity).toBe("");
    // errors は入力中に更新しない（送信時の validate 結果に一本化するため）
    expect(result.current.errors.capacity).toBe(
      "定員数は0以上の整数で入力してください。",
    );
  });

  it("他項目のエラーがある状態で申し込みURLを入力しても errors オブジェクトは更新されず、ジャンプが再発しない", async () => {
    const { result } = renderHook(() => useEventPostForm());

    // 定員は未入力（エラーなし）のまま送信し、他項目のエラーだけを出す
    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });
    const errorsBefore = result.current.errors;
    expect(Object.keys(errorsBefore).length).toBeGreaterThan(0);

    act(() => {
      result.current.setField("applicationUrl", "https://example.com/apply");
    });

    // errors の参照が変わらないため、useJumpToFirstError は再ジャンプしない
    expect(result.current.errors).toBe(errorsBefore);
  });

  it("定員エラーと他項目エラーが併存する状態で申し込みURLを入力しても errors は更新されず、再送信で定員エラーだけ消える", async () => {
    const { result } = renderHook(() => useEventPostForm());

    // 定員エラー（不正値）と他項目エラー（タイトル未入力）を併存させる
    act(() => {
      result.current.setField("capacity", "abc");
    });
    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });
    expect(result.current.errors.capacity).toBe(
      "定員数は0以上の整数で入力してください。",
    );
    expect(result.current.errors.eventName).toBe(
      "イベントタイトルは必須です。",
    );

    const errorsBefore = result.current.errors;
    act(() => {
      result.current.setField("applicationUrl", "https://example.com/apply");
    });

    // errors の参照が変わらないため、useJumpToFirstError は再ジャンプしない
    expect(result.current.errors).toBe(errorsBefore);

    // 再送信（他の必須項目も入力して送信）すると、URL 設定時は定員が検証されずエラーだけ消える
    fillBaseFields(result.current.setField);
    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });
    expect(result.current.errors).not.toHaveProperty("capacity");
    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
  });

  it("申し込みURL設定時は定員が不正値でもエラーにならず送信できる", async () => {
    const { result } = renderHook(() => useEventPostForm());
    fillBaseFields(result.current.setField);

    act(() => {
      result.current.setField("capacity", "abc");
      result.current.setField("applicationUrl", "https://example.com/apply");
    });

    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    expect(result.current.errors.capacity).toBeUndefined();
    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
  });

  it("申し込みURL設定時は capacity を payload に含めず、externalUrl を含める", async () => {
    const { result } = renderHook(() => useEventPostForm());
    fillBaseFields(result.current.setField);

    act(() => {
      result.current.setField("capacity", "30");
      result.current.setField("applicationUrl", "https://example.com/apply");
    });

    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    const payload = mockCreateEvent.mock.calls[0][0];
    // capacity プロパティそのものが存在しないことまで検証する
    expect(payload).not.toHaveProperty("capacity");
    expect(payload.externalUrl).toBe("https://example.com/apply");
  });

  it("申し込みURL未設定時は従来どおり capacity を payload に含める", async () => {
    const { result } = renderHook(() => useEventPostForm());
    fillBaseFields(result.current.setField);

    act(() => {
      result.current.setField("capacity", "30");
    });

    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    const payload = mockCreateEvent.mock.calls[0][0];
    expect(payload.capacity).toBe(30);
    expect(payload.externalUrl).toBeUndefined();
  });
});

describe("EventPostForm の定員入力欄の非表示", () => {
  // useJumpToFirstError が使う scrollIntoView をスタブする（テスト後は戻す）
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  afterEach(() => {
    cleanup();
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  const buildFormState = (
    overrides: Partial<EventPostFormState> = {},
  ): EventPostFormState => ({
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
    capacity: "30",
    applicationDeadline: "",
    applicationUrl: "",
    requiredItems: [],
    tags: [],
    ...overrides,
  });

  it("申し込みURLが設定されている間は入力欄を外し、ラベルと理由をグループとして関連付けて残す", () => {
    render(
      <EventPostForm
        formState={buildFormState({
          applicationUrl: "https://example.com/apply",
        })}
        errors={{}}
        setField={() => {}}
      />,
    );

    // 入力欄（ボックス）だけが DOM から外れる
    expect(
      screen.queryByRole("textbox", { name: /定員数/ }),
    ).not.toBeInTheDocument();
    // ラベルと注意書きは role="group" として関連付いたまま残り、理由を伝える
    const group = screen.getByRole("group", { name: /定員数/ });
    expect(group).toHaveAccessibleDescription(
      "申し込みURLが設定されているため、定員を受け付けません。",
    );
  });

  it("申し込みURLが未設定のときは定員入力欄は入力できる", () => {
    render(
      <EventPostForm
        formState={buildFormState()}
        errors={{}}
        setField={() => {}}
      />,
    );

    expect(screen.getByLabelText(/定員数/)).toBeEnabled();
  });
});
