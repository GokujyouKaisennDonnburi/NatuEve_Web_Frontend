import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SortButton } from "@/components/atoms/SortButton";

const options = [
  { value: "event_date", label: "開催日が近い順" },
  { value: "created_at", label: "投稿が新しい順" },
];

// ボタン全体をクリック判定にするため、透過 select をボタン全体に被せる構造の
// 挙動を検証する。表示テキストは選択中オプションのラベルで、onChange は
// ネイティブ select の変更時にのみ呼ばれる。
describe("SortButton", () => {
  it("選択中の値のラベルを表示する", () => {
    render(
      <SortButton options={options} value="created_at" onChange={() => {}} />,
    );

    expect(screen.getByText("投稿が新しい順")).toBeInTheDocument();
  });

  it("セレクトの変更で選択した値が onChange に渡される", () => {
    const onChange = vi.fn();
    render(
      <SortButton options={options} value="created_at" onChange={onChange} />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "並び替え" }), {
      target: { value: "event_date" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("event_date");
  });

  it("label 指定時は aria-label にその値が使われる", () => {
    render(
      <SortButton
        options={options}
        value="created_at"
        onChange={() => {}}
        label="並び替え"
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "並び替え" }),
    ).toBeInTheDocument();
  });
});
