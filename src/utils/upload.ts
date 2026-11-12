import type { UploadKind } from "@/types/upload";
import { MAX_IMAGE_PIXELS, readImagePixelSize } from "@/utils/imageSize";

// 画像の最大サイズ（10MB）。クライアント検証は UX 補助で、最終判断はサーバー側。
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// PDF の最大サイズ（20MB）。
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

// 拡張子 → Content-Type のマッピング。file.type が空のときの補完に使う。
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

// kind ごとに許可する Content-Type。WebP は MVP 非対応。
const ALLOWED_CONTENT_TYPES: Record<UploadKind, readonly string[]> = {
  image: ["image/jpeg", "image/png"],
  pdf: ["application/pdf"],
};

// クライアント検証で弾けたことを表すエラー。送信フローはこれを toast 表示して中断する。
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

// ファイル名末尾の拡張子を小文字で取り出す（ドット無し）。
const getExtension = (fileName: string): string => {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
};

// file.type を優先し、空のときは拡張子から Content-Type を補完する。
// presign / R2 PUT 双方で同じ値を使うため、解決は 1 か所に集約する。
export const resolveContentType = (file: File): string => {
  if (file.type) {
    return file.type;
  }
  return EXTENSION_CONTENT_TYPES[getExtension(file.name)] ?? "";
};

// 画像の縦横ピクセル数が上限を超えていないか検証する。問題なければ null。
// ヘッダ解析だけで判定するため、画像全体をデコード（読み込み）する前に確かめられる。
const validateImagePixelSize = async (file: File): Promise<string | null> => {
  const size = await readImagePixelSize(file);
  if (!size) {
    return null;
  }
  if (size.width > MAX_IMAGE_PIXELS || size.height > MAX_IMAGE_PIXELS) {
    return `${file.name} は画像が大きすぎます。縦横${MAX_IMAGE_PIXELS}px 以下の画像を選択してください。`;
  }
  return null;
};

// 1 ファイルの拡張子・Content-Type・サイズ・（画像なら）縦横ピクセル数を検証する。
// 寸法判定はファイルを読み込むため非同期。問題なければ null。
export const validateUploadFile = async (
  file: File,
  kind: UploadKind,
): Promise<string | null> => {
  const contentType = resolveContentType(file);

  if (!contentType) {
    const hint = kind === "image" ? "JPEG / PNG" : "PDF";
    return `${file.name} は形式を判別できません。${hint} を選択してください。`;
  }

  if (!ALLOWED_CONTENT_TYPES[kind].includes(contentType)) {
    if (kind === "image") {
      return `${file.name} は対応していない画像形式です（JPEG / PNG のみ）`;
    }
    return `${file.name} は PDF ファイルではありません。`;
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  if (file.size > maxBytes) {
    const maxMb = Math.floor(maxBytes / (1024 * 1024));
    return `${file.name} はサイズが上限（${maxMb}MB）を超えています。`;
  }

  if (kind === "image") {
    const pixelError = await validateImagePixelSize(file);
    if (pixelError) {
      return pixelError;
    }
  }

  return null;
};

// 複数ファイルをまとめて検証し、最初に見つかったエラーメッセージを返す（無ければ null）。
export const findUploadValidationError = async (
  entries: ReadonlyArray<{ file: File; kind: UploadKind }>,
): Promise<string | null> => {
  for (const { file, kind } of entries) {
    const error = await validateUploadFile(file, kind);
    if (error) {
      return error;
    }
  }
  return null;
};

// 追加できなかったファイルの名前を「a」「b」形式に整形する。
// 3件以上は先頭だけ挙げて件数でまとめる。
export const formatFileNames = (targets: readonly File[]): string => {
  const names = targets.map((file) => `「${file.name}」`);
  if (names.length <= 2) {
    return names.join("");
  }
  return `${names[0]}ほか${names.length - 1}件`;
};
