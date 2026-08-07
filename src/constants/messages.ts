import { MAX_TAG_COUNT, MAX_TAG_LENGTH } from "@/constants/config";

export const MESSAGES = {
  LOADING_USERS: "ユーザーを取得しています",
  USER_FETCH_ERROR: "ユーザーの取得に失敗しました",
  EMPTY_USERS: "表示できるユーザーがありません",

  // タグ入力の上限。入力欄の外に常設せず、上限に触れた時点でトーストで知らせる。
  TAG_LENGTH_EXCEEDED: `タグは1つあたり${MAX_TAG_LENGTH}文字以内で入力してください`,
  TAG_COUNT_EXCEEDED: `タグは最大${MAX_TAG_COUNT}件まで追加できます`,
} as const;
