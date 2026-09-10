import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TagInputField } from "@/components/molecules/event-post/TagInputField";
import { MESSAGES } from "@/constants/messages";
import { createTag, getTags } from "@/services/tag";
import { TagError, TagErrorCode, type TagItem } from "@/types/tag";

// createTag / getTags を差し替え、実 API を叩かずに
// 「新規作成→409重複→一覧取得」というサーバー側の実挙動を再現する。
vi.mock("@/services/tag", () => ({
  createTag: vi.fn(),
  getTags: vi.fn(),
}));

// toast が呼ばれたかどうかを検証したいのでスパイ化する。
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const mockedCreateTag = vi.mocked(createTag);
const mockedGetTags = vi.mocked(getTags);

// globals: false のため、testing-library の自動クリーンアップが効かない。
// render したコンポーネントがテストをまたいで残らないよう明示的に片付ける。
afterEach(() => {
  cleanup();
});

// clearAllMocks は呼び出し履歴しか消さず mockResolvedValue の実装は残るため、
// テスト間で応答が漏れないよう reset で毎回まっさらにする。
beforeEach(() => {
  vi.resetAllMocks();
});

// tags / onTagsChange は投稿フォーム本体が state で持つ制御コンポーネントなので、
// テストでも同じ形で薄いラッパーに包んでレンダリングする。
function Harness() {
  const [tags, setTags] = useState<TagItem[]>([]);
  return <TagInputField id="tags" tags={tags} onTagsChange={setTags} />;
}

// 送信中はラベルが "追加中…" に変わり同じ参照では掴めないので、都度クエリし直す。
const getAddButton = () => screen.getByRole("button", { name: "追加" });

// 初回のタグ一覧取得が終わり、入力を受け付けられる状態まで進める。
const renderAndWaitForTags = async (initialTags: TagItem[]) => {
  mockedGetTags.mockResolvedValueOnce({ tags: initialTags });
  render(<Harness />);
  await waitFor(() => expect(mockedGetTags).toHaveBeenCalledTimes(1));
  return screen.getByLabelText("タグ");
};

const duplicateTagError = () =>
  new TagError(TagErrorCode.DuplicateTag, "既に存在するタグです", 409);

describe("TagInputField", () => {
  it("新規タグを追加→削除→同名を再追加してもチップとして表示される（本命の回帰）", async () => {
    // 初回マウント時点ではまだ「散歩」は存在しない
    const input = await renderAndWaitForTags([]);

    // 1回目: 新規作成が成功する
    mockedCreateTag.mockResolvedValueOnce({ id: "tag-1", name: "散歩" });
    fireEvent.change(input, { target: { value: "散歩" } });
    fireEvent.click(getAddButton());
    await screen.findByText("散歩");

    // チップを削除する。サーバー側の「散歩」は残ったままになる
    fireEvent.click(screen.getByRole("button", { name: "タグ「散歩」を削除" }));
    expect(screen.queryByText("散歩")).not.toBeInTheDocument();

    // 2回目: サーバーには既に「散歩」があるため 409 duplicate_tag が返る
    mockedCreateTag.mockRejectedValueOnce(duplicateTagError());
    fireEvent.change(input, { target: { value: "散歩" } });
    fireEvent.click(getAddButton());

    // 修正前はここで無言のまま何も起きなかった
    await screen.findByText("散歩");
    // 作成時に addTag で一覧へ反映済みなので、一覧を取り直さずに復旧できている
    expect(mockedGetTags).toHaveBeenCalledTimes(1);
  });

  it("手元の一覧に無いタグが 409 になったら、一覧を取り直して既存タグを追加する", async () => {
    // 別のタブなどこの画面の外で「散歩」が作られ、初回に取得した一覧には無い状況
    const input = await renderAndWaitForTags([]);

    mockedCreateTag.mockRejectedValueOnce(duplicateTagError());
    mockedGetTags.mockResolvedValueOnce({
      tags: [{ id: "tag-1", name: "散歩" }],
    });

    fireEvent.change(input, { target: { value: "散歩" } });
    fireEvent.click(getAddButton());

    await screen.findByText("散歩");
    expect(mockedGetTags).toHaveBeenCalledTimes(2);
  });

  it("409 リカバリで一覧を取り直している間も、入力欄と追加ボタンは操作できない", async () => {
    // 作成 API が終わった時点で操作を解禁すると、取り直しの往復中に別のタグを
    // 追加でき、上限（MAX_TAG_COUNT）超過や重複をすり抜けさせてしまう。
    const input = await renderAndWaitForTags([]);

    mockedCreateTag.mockRejectedValueOnce(duplicateTagError());
    // 取り直しを保留し、リカバリ中の状態を観測できるようにする
    let resolveRefetch: (value: { tags: TagItem[] }) => void = () => {};
    mockedGetTags.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefetch = resolve;
      }),
    );

    fireEvent.change(input, { target: { value: "散歩" } });
    fireEvent.click(getAddButton());

    // 作成 API は既に失敗しているが、リカバリが終わるまでは閉じたまま
    await waitFor(() => expect(mockedGetTags).toHaveBeenCalledTimes(2));
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "追加中…" })).toBeDisabled();

    resolveRefetch({ tags: [{ id: "tag-1", name: "散歩" }] });

    await screen.findByText("散歩");
    await waitFor(() => expect(getAddButton()).toBeInTheDocument());
    expect(input).not.toBeDisabled();
  });

  it("作成成功後に削除して同名を再入力すると、新規作成ではなく既存候補として出る", async () => {
    const input = await renderAndWaitForTags([]);

    mockedCreateTag.mockResolvedValueOnce({ id: "tag-1", name: "散歩" });
    fireEvent.change(input, { target: { value: "散歩" } });
    fireEvent.click(getAddButton());
    await screen.findByText("散歩");

    fireEvent.click(screen.getByRole("button", { name: "タグ「散歩」を削除" }));

    // addTag によって allTags に反映済みなので、再入力すると既存候補として出る
    fireEvent.change(input, { target: { value: "散歩" } });
    await screen.findByRole("option", { name: "散歩" });

    // 同名の新規作成を促す行は出ない（二重作成を誘わない）
    expect(screen.queryByText("「散歩」を追加")).not.toBeInTheDocument();
  });

  it("409 だが取り直しても既存タグが見つからない場合はトーストで知らせる（無言終了しない）", async () => {
    // 初回・再取得のどちらも対象のタグを含まない＝サーバーと足並みが揃わない異常系
    const input = await renderAndWaitForTags([]);
    mockedCreateTag.mockRejectedValueOnce(duplicateTagError());
    mockedGetTags.mockResolvedValueOnce({ tags: [] });

    fireEvent.change(input, { target: { value: "迷子タグ" } });
    fireEvent.click(getAddButton());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(MESSAGES.TAG_ADD_FAILED);
    });
    expect(screen.queryByText("迷子タグ")).not.toBeInTheDocument();
  });
});
