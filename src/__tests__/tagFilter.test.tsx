import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TagFilter } from "@/components/molecules/TagFilter";
import type { TagItem } from "@/types/tag";

const allTags: TagItem[] = [
  { id: "tag-1", name: "双眼鏡" },
  { id: "tag-2", name: "野鳥" },
];

// globals: false のため、testing-library の自動クリーンアップが効かない。
// render したコンポーネントがテストをまたいで残らないよう明示的に片付ける。
afterEach(() => {
  cleanup();
});

// selectedIds / onTagSelect は一覧画面本体が state で持つ制御コンポーネントなので、
// テストでも同じ形で薄いラッパーに包んでレンダリングする。
function Harness({
  onTagSelect,
}: Readonly<{ onTagSelect?: (id: string) => void }>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <TagFilter
      allTags={allTags}
      frequentTags={[]}
      selectedIds={selectedIds}
      onTagSelect={(id) => {
        onTagSelect?.(id);
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
        );
      }}
    />
  );
}

const getInput = () => screen.getByRole("combobox");

// 検索欄でタグ名の一部を入力し、候補をマウスダウンで選択してチップを作る
const selectTagFromSearch = (query: string, tagName: string) => {
  fireEvent.change(getInput(), { target: { value: query } });
  fireEvent.mouseDown(screen.getByText(tagName));
};

describe("TagFilter", () => {
  it("チップがある状態でBackSpaceを押すと最後のチップが未選択になる", () => {
    const onTagSelect = vi.fn();
    render(<Harness onTagSelect={onTagSelect} />);

    selectTagFromSearch("双眼", "双眼鏡");
    expect(screen.getByRole("button", { name: "双眼鏡" })).toBeInTheDocument();

    fireEvent.keyDown(getInput(), { key: "Backspace" });

    expect(onTagSelect).toHaveBeenCalledWith("tag-1");
    expect(
      screen.queryByRole("button", { name: "双眼鏡" }),
    ).not.toBeInTheDocument();
  });

  it("複数チップがあるときはBackSpaceを押すたびに最後のチップから順に削除される", () => {
    render(<Harness />);

    selectTagFromSearch("双眼", "双眼鏡");
    selectTagFromSearch("野鳥", "野鳥");

    fireEvent.keyDown(getInput(), { key: "Backspace" });
    expect(
      screen.queryByRole("button", { name: "野鳥" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "双眼鏡" })).toBeInTheDocument();

    fireEvent.keyDown(getInput(), { key: "Backspace" });
    expect(
      screen.queryByRole("button", { name: "双眼鏡" }),
    ).not.toBeInTheDocument();
  });

  it("テキスト入力中でもチップがあればBackSpaceでチップを削除し、テキストは保持する", () => {
    render(<Harness />);

    selectTagFromSearch("双眼", "双眼鏡");
    fireEvent.change(getInput(), { target: { value: "野鳥" } });

    // 既定の文字削除が動かないよう preventDefault されていること
    const notPrevented = fireEvent.keyDown(getInput(), { key: "Backspace" });

    expect(notPrevented).toBe(false);
    expect(
      screen.queryByRole("button", { name: "双眼鏡" }),
    ).not.toBeInTheDocument();
    expect(getInput()).toHaveValue("野鳥");
  });

  it("チップが無い状態のBackSpaceはタグ選択に影響しない", () => {
    const onTagSelect = vi.fn();
    render(<Harness onTagSelect={onTagSelect} />);

    fireEvent.change(getInput(), { target: { value: "野鳥" } });
    fireEvent.keyDown(getInput(), { key: "Backspace" });

    expect(onTagSelect).not.toHaveBeenCalled();
  });

  it("IME変換中のBackSpaceではチップを削除しない", () => {
    render(<Harness />);

    selectTagFromSearch("双眼", "双眼鏡");
    fireEvent.keyDown(getInput(), { key: "Backspace", isComposing: true });

    expect(screen.getByRole("button", { name: "双眼鏡" })).toBeInTheDocument();
  });
});
