import type { UploadKind } from "@/types/upload";

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

// 1 ファイルの拡張子・Content-Type・サイズを検証する。問題なければ null。
export const validateUploadFile = (
  file: File,
  kind: UploadKind,
): string | null => {
  const contentType = resolveContentType(file);

  if (!contentType) {
    const hint = kind === "image" ? "JPEG / PNG" : "PDF";
    return `${file.name} は形式を判別できません。${hint} を選択してください。`;
  }

  if (!ALLOWED_CONTENT_TYPES[kind].includes(contentType)) {
    if (kind === "image") {
      return `${file.name} は対応していない画像形式です（JPEG / PNG のみ・WebP不可）。`;
    }
    return `${file.name} は PDF ファイルではありません。`;
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  if (file.size > maxBytes) {
    const maxMb = Math.floor(maxBytes / (1024 * 1024));
    return `${file.name} はサイズが上限（${maxMb}MB）を超えています。`;
  }

  return null;
};

// 複数ファイルをまとめて検証し、最初に見つかったエラーメッセージを返す（無ければ null）。
export const findUploadValidationError = (
  entries: ReadonlyArray<{ file: File; kind: UploadKind }>,
): string | null => {
  for (const { file, kind } of entries) {
    const error = validateUploadFile(file, kind);
    if (error) {
      return error;
    }
  }
  return null;
};
