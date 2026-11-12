// 画像の縦横ピクセル数の上限。API 側（NatuEve_API issue #274）と揃えた値。
// image.DecodeConfig が全体を復元せずに寸法を読めるのと同様に、
// Web でもデコード前にヘッダだけで判定する。
export const MAX_IMAGE_PIXELS = 8000;

// 寸法を表す型。単位はピクセル。
export type ImagePixelSize = {
  width: number;
  height: number;
};

// PNG シグネチャ（89 50 4E 47 0D 0A 1A 0A）。
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

// JPEG ヘッダの SOI（FF D8）。
const JPEG_SOI = [0xff, 0xd8] as const;

const isPng = (bytes: Uint8Array): boolean =>
  PNG_SIGNATURE.every((value, index) => bytes[index] === value);

const isJpeg = (bytes: Uint8Array): boolean =>
  JPEG_SOI.every((value, index) => bytes[index] === value);

// ビッグエンディアンの uint32 を読む。
const readUint32BE = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]) >>>
  0;

// ビッグエンディアンの uint16 を読む。
const readUint16BE = (bytes: Uint8Array, offset: number): number =>
  (bytes[offset] << 8) | bytes[offset + 1];

// PNG の IHDR チャンクから寸法を読む。先頭 24 バイトで足りる。
const readPngSize = (bytes: Uint8Array): ImagePixelSize | null => {
  if (bytes.length < 24) {
    return null;
  }
  // 8 バイトのシグネチャの後に、長さ4 + "IHDR" + 幅4 + 高さ4 が続く。
  const ihdr = [0x49, 0x48, 0x44, 0x52];
  const isIhdr = ihdr.every((value, index) => bytes[12 + index] === value);
  if (!isIhdr) {
    return null;
  }
  return {
    width: readUint32BE(bytes, 16),
    height: readUint32BE(bytes, 20),
  };
};

// JPEG の SOF（フレームヘッダ）マーカーから寸法を読む。
// 画像全体は復元せず、マーカーを順に辿るだけなのでデコードに比べて軽い。
const readJpegSize = (bytes: Uint8Array): ImagePixelSize | null => {
  // 寸法はセグメント長で辿れば分かるため、全体を一括で読む必要があるのは
  // SOF がファイル後方に置かれる稀なケースのみ。サイズ上限（10MB）以内なら負担は小さい。
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }
    const marker = bytes[offset + 1];

    // セグメント長を持たないマーカー（SOI など）は2バイトで読み飛ばす
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
      continue;
    }

    const segmentLength = readUint16BE(bytes, offset + 2);

    // SOF0〜SOF15 のうち DHT / JPG / DAC 以外がフレームヘッダ。寸法はこの中にある。
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof && offset + 9 <= bytes.length) {
      return {
        height: readUint16BE(bytes, offset + 5),
        width: readUint16BE(bytes, offset + 7),
      };
    }

    offset += 2 + segmentLength;
  }
  return null;
};

// File の中身を ArrayBuffer として読む。File#arrayBuffer() は jsdom が未実装のため、
// ブラウザと jsdom の両方で動く FileReader 経由で読む。
const readFileBytes = (file: File): Promise<Uint8Array | null> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });

// 画像ファイルの縦横ピクセル数を、デコードせずヘッダ解析だけで読む。
// JPEG / PNG 以外や壊れたヘッダは寸法を確かめられないため null を返す。
// 判別できない画像はここでは弾かず、送信後のサーバー側判定に任せる。
export const readImagePixelSize = async (
  file: File,
): Promise<ImagePixelSize | null> => {
  const bytes = await readFileBytes(file);
  if (!bytes) {
    return null;
  }

  if (isPng(bytes)) {
    return readPngSize(bytes);
  }
  if (isJpeg(bytes)) {
    return readJpegSize(bytes);
  }
  return null;
};
