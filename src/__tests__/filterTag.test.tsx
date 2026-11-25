import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FilterTag } from "@/components/atoms/FilterTag";

describe("FilterTag", () => {
  it("ラベルは幅制約時に省略できるよう内側の span に truncate を持つ", () => {
    render(<FilterTag label="双眼鏡" />);

    expect(screen.getByText("双眼鏡")).toHaveClass("truncate");
  });

  it("className は本体の要素に渡される", () => {
    render(
      <FilterTag
        label="双眼鏡"
        title="双眼鏡"
        className="max-w-[12rem] truncate"
      />,
    );

    expect(screen.getByTitle("双眼鏡")).toHaveClass("max-w-[12rem]");
  });

  it("title を渡すとホバーで全文を確認できる", () => {
    render(<FilterTag label="双眼鏡" title="双眼鏡" />);

    expect(screen.getByTitle("双眼鏡")).toBeInTheDocument();
  });

  it("onClick があるときは押下でハンドラーが呼ばれる", () => {
    const onClick = vi.fn();
    render(<FilterTag label="双眼鏡" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "双眼鏡" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
