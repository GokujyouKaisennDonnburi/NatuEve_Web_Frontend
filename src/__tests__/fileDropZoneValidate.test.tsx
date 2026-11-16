import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileDropZone } from "@/components/molecules/FileDropZone";
import { createPngFile } from "./imageTestFiles";
import { validateUploadFile } from "@/utils/upload";

// FileDropZone がプレビューに使う object URL と next/image は jsdom ではスタブする
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  URL.createObjectURL = () => "blob:stub";
  URL.revokeObjectURL = () => {};
  vi.mock("next/image", () => ({
    default: ({ src, alt }: { src: string; alt: string }) => (
      // biome-ignore lint/performance/noImgElement: テスト用のスタブ
      <img src={src} alt={alt} />
    ),
  }));
});

afterEach(() => {
  cleanup();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

const renderZone = (onFilesChange: (files: File[]) => void) =>
  render(
    <FileDropZone
      id="event-image"
      accept="image/jpeg,image/png"
      files={[]}
      onFilesChange={onFilesChange}
      promptLabel="クリックまたはドラッグで画像をアップロード"
      validate={(file) => validateUploadFile(file, "image")}
    />,
  );

describe("FileDropZone の画像ピクセル数チェック", () => {
  it("上限を超える画像は読み込み前にエラーになり、フォームへ渡されない", async () => {
    const onFilesChange = vi.fn();
    const { container } = renderZone(onFilesChange);

    const input = container.querySelector<HTMLInputElement>("#event-image");
    expect(input).not.toBeNull();

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [createPngFile(8001, 8001)] },
    });

    const message = await screen.findByText(/は画像が大きすぎます/);
    expect(message).toBeInTheDocument();
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it("上限以内の画像はこれまでどおり添付できる", async () => {
    const onFilesChange = vi.fn();
    const { container } = renderZone(onFilesChange);

    const input = container.querySelector<HTMLInputElement>("#event-image");
    const file = createPngFile(1920, 1080);
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalledWith([file]);
    });
    expect(screen.queryByText(/は画像が大きすぎます/)).not.toBeInTheDocument();
  });
});
