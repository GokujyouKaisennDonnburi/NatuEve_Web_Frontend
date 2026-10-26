import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";

export const MESSAGES = {
  // ユーザー情報の取得
  LOADING_USERS: "ユーザーを取得しています",
  USER_FETCH_ERROR: "ユーザーの取得に失敗しました",
  EMPTY_USERS: "表示できるユーザーがありません",

  // イベント投稿への遷移
  EVENT_POST_SIGNIN_REQUIRED: "イベントを投稿するにはサインインしてください。",

  // タグ入力。エラーは必要なときだけトーストで知らせる。
  TAG_LENGTH_EXCEEDED: `タグは1つあたり${MAX_TAG_LENGTH}文字以内で入力してください`,
  TAG_COUNT_EXCEEDED: `タグは最大${MAX_TAG_COUNT}件まで追加できます`,
  TAG_ADD_FAILED: "タグの追加に失敗しました。時間をおいて再度お試しください",
} as const;
