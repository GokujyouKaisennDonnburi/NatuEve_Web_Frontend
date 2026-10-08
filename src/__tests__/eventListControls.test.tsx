import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventListControls } from "@/components/organisms/EventListControls";

const sortOptions = [
  { value: "event_date", label: "開催日が近い順" },
  { value: "created_at", label: "投稿が新しい順" },
];

const createProps = () => ({
  searchInitialValue: "",
  onSearch: vi.fn(),
  sortOptions,
  sortValue: "created_at",
  onSortChange: vi.fn(),
  onFilterToggle: vi.fn(),
  isFilterActive: false,
  isFilterExpanded: false,
  filterControlsId: "event-list-filters",
});

// 検索バー・並び替え・絞り込み開閉ボタンをまとめて扱うコンテナの挙動を検証する。
// それぞれの内部仕様は各コンポーネントのテストで確認済みのため、
// ここではページから渡されたハンドラーへの委譲のみを確認する。
describe("EventListControls", () => {
  it("初期値が検索入力欄に反映される", () => {
    const props = createProps();
    render(
      <EventListControls {...props} searchInitialValue="ホタル" />,
    );

    expect(screen.getByRole("searchbox")).toHaveValue("ホタル");
  });

  it("検索ボタン押下で入力値が onSearch に渡される", () => {
    const props = createProps();
    render(<EventListControls {...props} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "干潟" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(props.onSearch).toHaveBeenCalledTimes(1);
    expect(props.onSearch).toHaveBeenCalledWith("干潟");
  });

  it("並び替えの変更で onSortChange に選択値が渡される", () => {
    const props = createProps();
    render(<EventListControls {...props} />);

    fireEvent.change(screen.getByRole("combobox", { name: "並び替え" }), {
      target: { value: "event_date" },
    });

    expect(props.onSortChange).toHaveBeenCalledTimes(1);
    expect(props.onSortChange).toHaveBeenCalledWith("event_date");
  });

  it("絞り込みボタン押下で onFilterToggle が呼ばれる", () => {
    const props = createProps();
    render(<EventListControls {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "絞り込み" }));

    expect(props.onFilterToggle).toHaveBeenCalledTimes(1);
  });

  it("絞り込みボタンがドロワーと aria-controls で関連付けられる", () => {
    const props = createProps();
    render(<EventListControls {...props} isFilterExpanded />);

    const filterButton = screen.getByRole("button", { name: "絞り込み" });
    expect(filterButton).toHaveAttribute("aria-controls", "event-list-filters");
    expect(filterButton).toHaveAttribute("aria-expanded", "true");
  });
});
