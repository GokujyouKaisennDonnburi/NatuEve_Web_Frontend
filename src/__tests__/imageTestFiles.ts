// 画像ヘッダだけを持つテスト用の File を作るヘルパー。
// 画像データは判定に関係しないため、シグネチャと寸法だけを詰める。
export const createPngFile = (width: number, height: number): File => {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x00, 0x00, 0x00, 0x0d], 8); // IHDR のデータ長（13）
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return new File([bytes], "test.png", { type: "image/png" });
};

// SOF0（ベースライン）の前に APP1 がある典型的な JPEG を模した File を作る。
export const createJpegFile = (
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
