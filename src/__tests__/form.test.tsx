import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { preventImplicitSubmit } from "@/utils/form";

// globals: false のため、testing-library の自動クリーンアップが効かない。
// render したフォームがテストをまたいで残らないよう明示的に片付ける。
afterEach(() => {
  cleanup();
});

// preventImplicitSubmit の動作確認用の小さな form。
// 暗黙の送信が起きる type（text / datetime-local / type 省略）と、
// 起きない type（file / checkbox）、textarea、submit ボタンを並べている。
function TestForm() {
  return (
    <form
      onKeyDown={preventImplicitSubmit}
      onSubmit={(event) => event.preventDefault()}
    >
      <input type="text" aria-label="タイトル" />
      <input aria-label="タグ" />
      <input type="datetime-local" aria-label="開催日時" />
      <textarea aria-label="本文" />
      <input type="file" aria-label="添付ファイル" />
      <input type="checkbox" aria-label="必須の持ち物" />
      <button type="submit">送信</button>
    </form>
  );
}

describe("preventImplicitSubmit", () => {
  it("テキスト input の Enter では preventDefault される（暗黙の送信を止める）", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("タイトル"), {
      key: "Enter",
    });
    expect(result).toBe(false);
  });

  it("type を書いていない input の Enter でも preventDefault される", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("タグ"), {
      key: "Enter",
    });
    expect(result).toBe(false);
  });

  it("datetime-local の Enter では preventDefault される", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("開催日時"), {
      key: "Enter",
    });
    expect(result).toBe(false);
  });

  it("textarea の Enter では preventDefault されない（改行を残すため）", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("本文"), {
      key: "Enter",
    });
    expect(result).toBe(true);
  });

  it("type=submit のボタンの Enter では preventDefault されない（キーボードで投稿できるようにするため）", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByText("送信"), {
      key: "Enter",
    });
    expect(result).toBe(true);
  });

  it("type=file の input の Enter では preventDefault されない", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("添付ファイル"), {
      key: "Enter",
    });
    expect(result).toBe(true);
  });

  it("checkbox の Enter では preventDefault されない（暗黙の送信を起こさないため）", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("必須の持ち物"), {
      key: "Enter",
    });
    expect(result).toBe(true);
  });

  it("IME 変換確定の Enter（isComposing: true）では preventDefault されない", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("タイトル"), {
      key: "Enter",
      isComposing: true,
    });
    expect(result).toBe(true);
  });

  it("Enter 以外のキーでは preventDefault されない", () => {
    render(<TestForm />);
    const result = fireEvent.keyDown(screen.getByLabelText("タイトル"), {
      key: "a",
    });
    expect(result).toBe(true);
  });
});
