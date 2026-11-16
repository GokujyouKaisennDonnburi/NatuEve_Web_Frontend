import { apiFetch } from "@/services/apiClient";
import type {
  PresignRequest,
  PresignResponse,
  UploadedFile,
  UploadKind,
} from "@/types/upload";
import {
  resolveContentType,
  UploadValidationError,
  validateUploadFile,
} from "@/utils/upload";

// presign エンドポイントを呼び、署名付き URL と objectKey を取得する（要認証）。
async function presignUpload(
  kind: UploadKind,
  contentType: string,
  size: number,
): Promise<PresignResponse> {
  const body: PresignRequest = { kind, contentType, size };

  const response = await apiFetch("/api/v1/uploads/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `署名付き URL の取得に失敗しました (Status: ${response.status})`,
    );
  }

  return (await response.json()) as PresignResponse;
}

// 署名付き URL を使って R2 へ直接 PUT する。
// 認証ヘッダは付けず（apiFetch を使わない）、presign 時と同じ Content-Type を厳格に一致させる。
// Content-Length は fetch が本体から付けるので手で付けない。presign で送った size と一致する必要がある。
async function putToR2(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `ファイルのアップロードに失敗しました (Status: ${response.status})`,
    );
  }
}

// 1 ファイルを presign → R2 直 PUT し、objectKey と元ファイル名を返す。
//
// presign の有効期限は 5 分のため、送信直前にこの関数を呼び、取得後すぐ PUT する運用とする。
// PUT 済みでもイベント作成しなければ tmp は自動失効するので、失敗時は同じファイルで再実行すればよい。
// filename は作成 API に渡すと、ダウンロード時のファイル名（Content-Disposition）と UI 表示に使われる。
export async function uploadFile(
  file: File,
  kind: UploadKind,
): Promise<UploadedFile> {
  const validationError = await validateUploadFile(file, kind);
  if (validationError) {
    throw new UploadValidationError(validationError);
  }

  // 署名には Content-Type と大きさが含まれるため、presign と PUT には同じ File をそのまま使う（間で圧縮・変換しない）。
  const contentType = resolveContentType(file);
  const { uploadUrl, objectKey } = await presignUpload(
    kind,
    contentType,
    file.size,
  );
  await putToR2(uploadUrl, file, contentType);

  return { objectKey, filename: file.name };
}

// 複数ファイルを逐次アップロードし、UploadedFile の配列を返す。
export async function uploadFiles(
  files: File[],
  kind: UploadKind,
): Promise<UploadedFile[]> {
  const uploaded: UploadedFile[] = [];
  for (const file of files) {
    uploaded.push(await uploadFile(file, kind));
  }
  return uploaded;
}
