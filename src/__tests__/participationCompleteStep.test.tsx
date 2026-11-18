import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ParticipationCompleteStep } from "@/components/organisms/participation/ParticipationCompleteStep";

describe("ParticipationCompleteStep", () => {
  it("ゲスト申込では確認メールのリンクから確定する案内を表示する", () => {
    render(<ParticipationCompleteStep isGuest />);

    expect(
      screen.getByText(/メール内のリンクから参加申込を確定してください/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("確認メールを送信しました"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("申し込みが完了しました"),
    ).not.toBeInTheDocument();
  });

  it("ゲスト申込ではお問い合わせページへのリンクを表示する", () => {
    render(<ParticipationCompleteStep isGuest />);

    const contactLink = screen.getByRole("link", { name: "お問い合わせ" });
    expect(contactLink).toHaveAttribute("href", "/contact");
  });

  it("ログイン申込では従来どおり完了を伝え、お問い合わせリンクを出さない", () => {
    render(<ParticipationCompleteStep isGuest={false} />);

    expect(screen.getByText("申し込みが完了しました")).toBeInTheDocument();
    expect(
      screen.queryByText("確認メールを送信しました"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "お問い合わせ" }),
    ).not.toBeInTheDocument();
  });
});
