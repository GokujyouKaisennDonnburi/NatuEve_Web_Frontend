import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ParticipationCompleteStep } from "@/components/organisms/participation/ParticipationCompleteStep";

describe("ParticipationCompleteStep", () => {
  it("ゲスト申込では確認メールの送信を伝える", () => {
    render(<ParticipationCompleteStep isGuest />);

    expect(screen.getByText("確認メールを送信しました")).toBeInTheDocument();
    expect(
      screen.getByText(/メール内のリンクから参加申込を確定してください/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("申し込みが完了しました"),
    ).not.toBeInTheDocument();
  });

  it("ログイン申込では従来どおり完了を伝える", () => {
    render(<ParticipationCompleteStep isGuest={false} />);

    expect(screen.getByText("申し込みが完了しました")).toBeInTheDocument();
    expect(
      screen.queryByText("確認メールを送信しました"),
    ).not.toBeInTheDocument();
  });
});
