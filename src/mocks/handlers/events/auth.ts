// このファイルは、MSW ハンドラー間で共有する認証系ヘルパを定義する。
// 本番ではトークン検証でユーザーID（profileId）が決まるが、モックでは
// トークン文字列をそのまま profileId として扱うと、主催者の profileId を直接
// Bearer に仕込むだけで主催者チェックを通過できてしまう認可バグの可能性あり
// そのため既知トークンのみを受け付け、未知トークンは 401 で弾く。
import { HttpResponse } from "msw";

import { MOCK_AUTH_SESSION } from "@/services/mockAuth";

// モック環境での「Bearer トークン → profileId」対応表。
export const TOKEN_TO_PROFILE_ID: Readonly<Record<string, string>> = {
  [MOCK_AUTH_SESSION.token]: MOCK_AUTH_SESSION.userId,
};

// Authorization ヘッダが本番相当の Bearer 形式かを判定する。
export const hasBearerToken = (authorizationHeader: string | null): boolean =>
  Boolean(authorizationHeader?.startsWith("Bearer "));

// Authorization ヘッダから Bearer トークン部分だけ抽出する。
// ヘッダがない / Bearer 形式でない場合は空文字を返す。
export const getBearerToken = (authorizationHeader: string | null): string =>
  authorizationHeader?.startsWith("Bearer ")
    ? (authorizationHeader.split(" ")[1]?.trim() ?? "")
    : "";

// 未認証（401 unauthorized）の共通レスポンスを生成する。
export const unauthorizedResponse = () =>
  HttpResponse.json(
    { error: { code: "unauthorized", message: "認証が必要です" } },
    { status: 401 },
  );
