// このファイルは、MSW ハンドラー間で共有する認証系ヘルパを定義する。
// 本番ではトークン検証でユーザーID（profileId）が決まるが、モックでは
// トークン文字列をそのまま profileId として扱うと、主催者の profileId を直接
// Bearer に仕込むだけで主催者チェックを通過できてしまう認可バグの可能性あり
// そのため既知トークンのみを受け付け、未知トークンは 401 で弾く。
import { HttpResponse } from "msw";

import { MOCK_AUTH_SESSION } from "@/services/mockAuth";
import type { EventMemberProfile } from "@/types/participate";

// モック環境での「Bearer トークン → プロフィールサマリー」対応表。
// モックで識別できるユーザーの唯一の定義であり、既知トークンの判定もこれで行う。
// 参加者一覧（GET /api/v1/events/:id/members）が返す profile の生成に使う。
export const TOKEN_TO_PROFILE: Readonly<Record<string, EventMemberProfile>> = {
  [MOCK_AUTH_SESSION.token]: {
    id: MOCK_AUTH_SESSION.userId,
    displayName: MOCK_AUTH_SESSION.name ?? "",
    avatarUrl: MOCK_AUTH_SESSION.iconUrl ?? "",
  },
};

// モック環境での「Bearer トークン → profileId」対応表。
// profileId だけあれば足りる箇所（主催者判定など）向けの導出ビュー。
// TOKEN_TO_PROFILE から生成するため、2つの対応表がズレることはない。
// 別々の定義にすると、片方だけにユーザーを足したときに
// 「認証は通るのに profile が null」という状態を作れてしまう。
export const TOKEN_TO_PROFILE_ID: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(TOKEN_TO_PROFILE).map(([token, profile]) => [
      token,
      profile.id,
    ]),
  );

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
