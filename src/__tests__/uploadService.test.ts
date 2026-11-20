import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPngFile } from "./imageTestFiles";
import { apiFetch } from "@/services/apiClient";
import { uploadFile } from "@/services/upload";
import type { PresignRequest, PresignResponse } from "@/types/upload";
import { UploadValidationError } from "@/utils/upload";

vi.mock("@/services/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

const presignResponse: PresignResponse = {
  uploadUrl: "https://storage.example.test/natueve/tmp/profile/uuid?X-Amz=1",
  objectKey: "natueve/tmp/profile/uuid",
  expiresAt: "2026-11-16T10:05:00Z",
};

// presign の呼び出しで送ったボディを取り出す。
const presignBody = (): PresignRequest => {
  const init = mockApiFetch.mock.calls[0]?.[1];
  if (typeof init?.body !== "string") {
    throw new Error("presign のボディが取得できません");
  }
  return JSON.parse(init.body) as PresignRequest;
};

describe("uploadFile", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => presignResponse,
    } as Response);
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockApiFetch.mockReset();
  });

  it("画像の presign に kind・contentType と、ファイルの大きさを size として送る", async () => {
    const file = createPngFile(100, 100);

    await uploadFile(file, "image");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/uploads/presign",
      expect.objectContaining({ method: "POST" }),
    );
    expect(presignBody()).toEqual({
      kind: "image",
      contentType: "image/png",
      size: file.size,
    });
  });

  it("PDF の presign にもファイルの大きさを size として送る", async () => {
    const file = new File(["%PDF-1.4 test"], "test.pdf", {
      type: "application/pdf",
    });

    await uploadFile(file, "pdf");

    expect(presignBody()).toEqual({
      kind: "pdf",
      contentType: "application/pdf",
      size: file.size,
    });
  });

  it("R2 へは渡した File をそのまま、presign で送った大きさと Content-Type のまま、認証ヘッダなしで PUT する", async () => {
    const file = createPngFile(100, 100);

    const uploaded = await uploadFile(file, "image");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(presignResponse.uploadUrl);
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(file);
    expect((init.body as File).size).toBe(presignBody().size);
    expect(init.headers).toEqual({ "Content-Type": presignBody().contentType });
    expect(uploaded).toEqual({
      objectKey: presignResponse.objectKey,
      filename: file.name,
    });
  });

  it("0 バイトのファイルは presign も PUT もせずに UploadValidationError を送出する", async () => {
    const file = new File([], "empty.png", { type: "image/png" });

    await expect(uploadFile(file, "image")).rejects.toBeInstanceOf(
      UploadValidationError,
    );
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
