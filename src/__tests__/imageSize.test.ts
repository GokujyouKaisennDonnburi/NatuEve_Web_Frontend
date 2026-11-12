import { describe, expect, it } from "vitest";

import { readImagePixelSize } from "@/utils/imageSize";

// ヘッダだけで判定するため、画像データは持たずシグネチャと寸法だけを詰めた File を作る。
const createPngFile = (width: number, height: number): File => {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x00, 0x00, 0x00, 0x0d], 8); // IHDR のデータ長（13）
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return new File([bytes], "test.png", { type: "image/png" });
};

// SOF0（ベースライン）の前に APP1 がある典型的な JPEG を模した File を作る。
const createJpegFile = (
  width: number,
  height: number,
  app1: boolean = true,
): File => {
  const segments: number[] = [0xff, 0xd8];
  if (app1) {
    const payload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
    segments.push(
      0xff,
      0xe1,
      ((payload.length + 2) >> 8) & 0xff,
      (payload.length + 2) & 0xff,
      ...payload,
    );
  }
  // SOF0: 長さ17、精度8、高さ、幅
  segments.push(
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
  );
  return new File([new Uint8Array(segments)], "test.jpg", {
    type: "image/jpeg",
  });
};

describe("readImagePixelSize", () => {
  it("PNG の寸法をヘッダから読める", async () => {
    const size = await readImagePixelSize(createPngFile(1920, 1080));
    expect(size).toEqual({ width: 1920, height: 1080 });
  });

  it("PNG の寸法が 8000x8000 のちょうど上限のときも読める", async () => {
    const size = await readImagePixelSize(createPngFile(8000, 8000));
    expect(size).toEqual({ width: 8000, height: 8000 });
  });

  it("JPEG の寸法を SOF マーカーから読める", async () => {
    const size = await readImagePixelSize(createJpegFile(6000, 4000));
    expect(size).toEqual({ width: 6000, height: 4000 });
  });

  it("EXIF など SOF の前のセグメントがあっても JPEG の寸法を読める", async () => {
    const size = await readImagePixelSize(createJpegFile(8000, 8000));
    expect(size).toEqual({ width: 8000, height: 8000 });
  });

  it("JPEG の寸法が 8000x8000 を1pxでも超えると上限超えの寸法が取れる", async () => {
    const size = await readImagePixelSize(createJpegFile(8001, 8000));
    expect(size).toEqual({ width: 8001, height: 8000 });
  });

  it("JPEG でも PNG でもないデータは null を返す", async () => {
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
      "test.pdf",
    );
    expect(await readImagePixelSize(file)).toBeNull();
  });

  it("壊れた JPEG ヘッダは null を返す", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0x00, 0x00]);
    const file = new File([bytes], "broken.jpg", { type: "image/jpeg" });
    expect(await readImagePixelSize(file)).toBeNull();
  });

  it("シグネチャの後に寸法が足りない PNG は null を返す", async () => {
    const bytes = new Uint8Array(20);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    const file = new File([bytes], "short.png", { type: "image/png" });
    expect(await readImagePixelSize(file)).toBeNull();
  });
});
