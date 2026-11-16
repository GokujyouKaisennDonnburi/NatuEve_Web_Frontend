import {
  EVENT_NOTIFICATION_WINDOW_HOURS,
  MAX_EVENT_NOTIFICATION_SENDS,
  MAX_NOTIFICATION_BODY_LENGTH,
  MAX_NOTIFICATION_SUBJECT_LENGTH,
  MAX_TAG_COUNT,
  MAX_TAG_LENGTH,
} from "@/constants/config";

export const MESSAGES = {
  LOADING_USERS: "ユーザーを取得しています",
  USER_FETCH_ERROR: "ユーザーの取得に失敗しました",
  EMPTY_USERS: "表示できるユーザーがありません",
  EVENT_POST_SIGNIN_REQUIRED: "イベントを投稿するにはサインインしてください。",
  NOTIFICATION_LIMIT_EXCEEDED: `このイベントの全体連絡は直近${EVENT_NOTIFICATION_WINDOW_HOURS}時間で${MAX_EVENT_NOTIFICATION_SENDS}回までです。今回は送信されていません。時間をおいてから再度お試しください。`,
  NOTIFICATION_SUBJECT_LENGTH_EXCEEDED: `件名は${MAX_NOTIFICATION_SUBJECT_LENGTH}文字以内で入力してください。`,
  NOTIFICATION_BODY_LENGTH_EXCEEDED: `本文は${MAX_NOTIFICATION_BODY_LENGTH}文字以内で入力してください。`,
  TAG_LENGTH_EXCEEDED: `タグは1つあたり${MAX_TAG_LENGTH}文字以内で入力してください`,
  TAG_COUNT_EXCEEDED: `タグは最大${MAX_TAG_COUNT}件まで追加できます`,
  // タグを追加できなかったときは、理由が分からない状態を避けるため必ずトーストで知らせる。
  TAG_ADD_FAILED: "タグの追加に失敗しました。時間をおいて再度お試しください",
} as const;
