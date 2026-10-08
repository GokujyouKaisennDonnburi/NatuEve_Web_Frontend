import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventPostForm } from "@/components/organisms/event-post/EventPostForm";
import { EVENT_POST_PREVIEW_SCROLL_MAPPING } from "@/components/organisms/event-post/eventPostPreviewScroll";
import { EventPostPreview } from "@/components/organisms/event-post/EventPostPreview";
import { ReportPostForm } from "@/components/organisms/report-post/ReportPostForm";
import type { ReportPostFormState } from "@/components/organisms/report-post/ReportPostForm";
import { ReportPostPreview } from "@/components/organisms/report-post/ReportPostPreview";
import {
  REPORT_CONTENT_CARD_ID,
  REPORT_POST_PREVIEW_SCROLL_MAPPING,
  REPORT_PREVIEW_REPORT_ID,
} from "@/components/organisms/report-post/reportPostPreviewScroll";
import type { EventPostFormState } from "@/hooks/useEventPostForm";

// 入力⇄プレビューの位置合わせの対応表（sourceId / targetIds）が、実際の DOM の id と
// ずれていないことを確かめるテスト。プレビュー側の部品（特にイベント詳細と共用の
// EventReportList など）から id が外れても、対応表だけを見るテストでは気づけないため。

// TagInputField が useTags / useCreateTag 経由で呼ぶ API を差し替え、実 API を叩かない。
vi.mock("@/services/tag", () => ({
  createTag: vi.fn(),
  getTags: vi.fn().mockResolvedValue({ tags: [] }),
}));

// プレビューは AuthProvider（Supabase）に依存するため、本人プロフィールだけ差し替える。
vi.mock("@/components/layouts/AuthProvider", () => ({
  useCurrentUserContext: () => ({
    user: null,
    isUserLoading: false,
    error: null,
    setUser: () => {},
  }),
}));

// next/image は jsdom では不要な処理が多いため、単純な img に置き換える。
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: テスト用のスタブ
    <img src={src} alt={alt} />
  ),
}));

// jsdom には window.matchMedia が無いため、カルーセル描画用にスタブする（テスト後に戻す）。
const originalMatchMedia = window.matchMedia;
// FileDropZone が添付ファイルのプレビューに使う object URL も jsdom には無いためスタブする。
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  URL.createObjectURL = () => "blob:stub";
  URL.revokeObjectURL = () => {};
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia;
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
});

const png = () => new File(["x"], "a.png", { type: "image/png" });
const pdf = () => new File(["x"], "a.pdf", { type: "application/pdf" });

// 描画した入力・プレビューの中だけを探す（もう片方の画面の同じ id に助けられないように）
const hasId = (container: HTMLElement, id: string) =>
  container.querySelector(`[id="${id}"]`) !== null;

describe("レポート投稿の対応表の id", () => {
  const formState: ReportPostFormState = {
    content: "本文",
    reportImages: [png(), png()],
    externalUrlEnabled: false,
    externalUrl: "",
    reportPdfs: [pdf()],
  };

  const renderForm = (state: ReportPostFormState) =>
    render(
      <ReportPostForm
        formState={state}
        validationErrors={{}}
        setFormState={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        isSubmitting={false}
      />,
    );

  const renderPreview = (state: ReportPostFormState) =>
    render(
      <ReportPostPreview
        formState={state}
        event={null}
        imageUrls={state.reportImages.map((_, i) => `blob:image-${i}`)}
        pdfUrls={state.reportPdfs.map((_, i) => `blob:pdf-${i}`)}
        onSubmit={() => {}}
        onCancel={() => {}}
        isSubmitting={false}
      />,
    );

  it.each(
    REPORT_POST_PREVIEW_SCROLL_MAPPING.map((m) => [m.sourceId, m] as const),
  )("入力に %s が存在する", (_name, mapping) => {
    const { container } = renderForm(formState);

    expect(hasId(container, mapping.sourceId)).toBe(true);
  });

  it.each(
    REPORT_POST_PREVIEW_SCROLL_MAPPING.map((m) => [m.sourceId, m] as const),
  )("画像・PDFありのとき、%s の対応先がすべてプレビューに存在する", (_name, mapping) => {
    const { container } = renderPreview(formState);

    for (const targetId of mapping.targetIds) {
      expect(hasId(container, targetId), `${targetId} が無い`).toBe(true);
    }
  });

  it("外部URLが有効なときも、レポート内容カードの対応先がプレビューに存在する", () => {
    const state: ReportPostFormState = {
      ...formState,
      externalUrlEnabled: true,
      externalUrl: "https://example.com/report",
    };
    const form = renderForm(state);
    expect(hasId(form.container, REPORT_CONTENT_CARD_ID)).toBe(true);
    cleanup();

    const preview = renderPreview(state);
    expect(hasId(preview.container, REPORT_PREVIEW_REPORT_ID)).toBe(true);
  });
});

describe("イベント投稿の対応表の id", () => {
  const formState: EventPostFormState = {
    eventName: "イベント",
    eventContent: "概要",
    eventImage: png(),
    eventDocuments: [pdf()],
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

  // targetIds が空（ページ先頭へ移すもの）は確かめる対象が無いため除外する
  const mappings = EVENT_POST_PREVIEW_SCROLL_MAPPING.filter(
    (m) => m.targetIds.length > 0,
  );

  it("すべての sourceId が入力に存在する（ページ先頭へ移すものも含む）", () => {
    const { container } = render(
      <EventPostForm formState={formState} errors={{}} setField={() => {}} />,
    );

    for (const mapping of EVENT_POST_PREVIEW_SCROLL_MAPPING) {
      expect(
        hasId(container, mapping.sourceId),
        `${mapping.sourceId} が無い`,
      ).toBe(true);
    }
  });

  it("画像・資料ありのとき、すべての targetIds がプレビューに存在する", () => {
    const { container } = render(
      <EventPostPreview
        formState={formState}
        imageUrls={["blob:image-0"]}
        pdfUrls={["blob:pdf-0"]}
      />,
    );

    for (const mapping of mappings) {
      for (const targetId of mapping.targetIds) {
        expect(
          hasId(container, targetId),
          `${mapping.sourceId} の対応先 ${targetId} が無い`,
        ).toBe(true);
      }
    }
  });
});
