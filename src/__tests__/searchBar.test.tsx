// import { fireEvent, render, screen } from "@testing-library/react";
// import { describe, expect, it, vi } from "vitest";
// import { SearchBar } from "@/components/molecules/SearchBar";
//
// // 検索は「検索」ボタン押下または Enter 押下時のみ実行される仕様を検証する。
// // 入力変更だけでは onSearch が呼ばれず、API リクエストが発生しないことを保証する。
// describe("SearchBar", () => {
//   it("入力変更だけでは onSearch が呼ばれない", () => {
//     const onSearch = vi.fn();
//     render(<SearchBar onSearch={onSearch} />);
//
//     fireEvent.change(screen.getByRole("searchbox"), {
//       target: { value: "ホタル" },
//     });
//
//     expect(onSearch).not.toHaveBeenCalled();
//   });
//
//   it("検索ボタン押下で入力値の前後空白を trim して onSearch が呼ばれる", () => {
//     const onSearch = vi.fn();
//     render(<SearchBar onSearch={onSearch} />);
//
//     fireEvent.change(screen.getByRole("searchbox"), {
//       target: { value: "  ホタル  " },
//     });
//     fireEvent.click(screen.getByRole("button", { name: "検索" }));
//
//     expect(onSearch).toHaveBeenCalledTimes(1);
//     expect(onSearch).toHaveBeenCalledWith("ホタル");
//   });
//
//   it("Enter 押下でも onSearch が呼ばれる", () => {
//     const onSearch = vi.fn();
//     render(<SearchBar onSearch={onSearch} />);
//
//     const input = screen.getByRole("searchbox");
//     fireEvent.change(input, { target: { value: "干潟" } });
//     fireEvent.keyDown(input, { key: "Enter" });
//
//     expect(onSearch).toHaveBeenCalledTimes(1);
//     expect(onSearch).toHaveBeenCalledWith("干潟");
//   });
//
//   it("空白のみの入力で検索すると空文字が渡される", () => {
//     const onSearch = vi.fn();
//     render(<SearchBar onSearch={onSearch} />);
//
//     fireEvent.change(screen.getByRole("searchbox"), {
//       target: { value: "  　 " },
//     });
//     fireEvent.click(screen.getByRole("button", { name: "検索" }));
//
//     expect(onSearch).toHaveBeenCalledWith("");
//   });
// });
//
