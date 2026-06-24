import { apiFetch } from "@/services/apiClient";
import type {
  PresignRequest,
  PresignResponse,
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
): Promise<PresignResponse> {
  const body: PresignRequest = { kind, contentType };

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

// 1 ファイルを presign → R2 直 PUT し、イベント作成に渡す objectKey を返す。
//
// presign の有効期限は 5 分のため、送信直前にこの関数を呼び、取得後すぐ PUT する運用とする。
// PUT 済みでもイベント作成しなければ tmp は自動失効するので、失敗時は同じファイルで再実行すればよい。
export async function uploadFile(
  file: File,
  kind: UploadKind,
): Promise<string> {
  const validationError = validateUploadFile(file, kind);
  if (validationError) {
    throw new UploadValidationError(validationError);
  }

  const contentType = resolveContentType(file);
  const { uploadUrl, objectKey } = await presignUpload(kind, contentType);
  await putToR2(uploadUrl, file, contentType);

  return objectKey;
}

// 複数ファイルを逐次アップロードし、objectKey の配列を返す。
export async function uploadFiles(
  files: File[],
  kind: UploadKind,
): Promise<string[]> {
  const objectKeys: string[] = [];
  for (const file of files) {
    objectKeys.push(await uploadFile(file, kind));
  }
  return objectKeys;
}
