import { describe, expect, it } from "vitest";

import { createJpegFile, createPngFile } from "./imageTestFiles";
import { validateUploadFile } from "@/utils/upload";

describe("validateUploadFile の画像ピクセル数チェック", () => {
  it("上限ちょうど（8000x8000）の画像は問題なし", async () => {
    const error = await validateUploadFile(createPngFile(8000, 8000), "image");
    expect(error).toBeNull();
  });

  it("上限以内の画像は問題なし", async () => {
    const error = await validateUploadFile(createJpegFile(6000, 4000), "image");
    expect(error).toBeNull();
  });

  it("幅が上限を超える画像は「画像が大きすぎます」のエラーになる", async () => {
    const error = await validateUploadFile(createPngFile(8001, 1000), "image");
    expect(error).toContain("は画像が大きすぎます");
  });

  it("高さが上限を超える画像は「画像が大きすぎます」のエラーになる", async () => {
    const error = await validateUploadFile(createJpegFile(1000, 8001), "image");
    expect(error).toContain("は画像が大きすぎます");
  });

  it("寸法の読めない画像はここでは弾かない", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0x00, 0x00]);
    const file = new File([bytes], "broken.jpg", { type: "image/jpeg" });
    const error = await validateUploadFile(file, "image");
    expect(error).toBeNull();
  });
});
