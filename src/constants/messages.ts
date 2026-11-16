import {
  EVENT_NOTIFICATION_WINDOW_HOURS,
  MAX_EVENT_NOTIFICATION_SENDS,
  MAX_TAG_COUNT,
  MAX_TAG_LENGTH,
} from "@/constants/config";

export const MESSAGES = {
  LOADING_USERS: "ユーザーを取得しています",
  USER_FETCH_ERROR: "ユーザーの取得に失敗しました",
  EMPTY_USERS: "表示できるユーザーがありません",
  NOTIFICATION_LIMIT_EXCEEDED: `このイベントの全体連絡は直近${EVENT_NOTIFICATION_WINDOW_HOURS}時間で${MAX_EVENT_NOTIFICATION_SENDS}回までです。今回は送信されていません。時間をおいてから再度お試しください。`,

  // タグ入力の上限。入力欄の外に常設せず、上限に触れた時点でトーストで知らせる。
  TAG_LENGTH_EXCEEDED: `タグは1つあたり${MAX_TAG_LENGTH}文字以内で入力してください`,
  TAG_COUNT_EXCEEDED: `タグは最大${MAX_TAG_COUNT}件まで追加できます`,
  // タグを追加できなかったときの汎用メッセージ。
  // 黙って何もしないと「追加できないのに理由が分からない」状態になるため必ず出す。
  TAG_ADD_FAILED: "タグの追加に失敗しました。時間をおいて再度お試しください",
} as const;
