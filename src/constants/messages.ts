import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";

export const MESSAGES = {
  LOADING_USERS: "ユーザーを取得しています",
  USER_FETCH_ERROR: "ユーザーの取得に失敗しました",
  EMPTY_USERS: "表示できるユーザーがありません",
  EVENT_POST_SIGNIN_REQUIRED: "イベントを投稿するにはサインインしてください。",
  TAG_LENGTH_EXCEEDED: `タグは1つあたり${MAX_TAG_LENGTH}文字以内で入力してください`,
  TAG_COUNT_EXCEEDED: `タグは最大${MAX_TAG_COUNT}件まで追加できます`,
  // タグを追加できなかったときは、理由が分からない状態を避けるため必ずトーストで知らせる。
  TAG_ADD_FAILED: "タグの追加に失敗しました。時間をおいて再度お試しください",
} as const;
