// このファイルは、参加・キャンセル・参加者一覧周りのハンドラー間で
// 共有するメモリ内状態と、その生成・操作ロジックを定義する。
// MSW はプロセス内状態のためリロードでリセットされる前提。
import { HttpResponse } from "msw";

import { MOCK_AUTH_SESSION } from "@/services/mockAuth";
import type {
  AbsenceReason,
  EventMemberProfile,
  ParticipantEntry,
} from "@/types/participate";

import { TOKEN_TO_PROFILE } from "./auth";

// participation-logs エンドポイントが返す参加履歴1件分の型。
// 直近のアクション（join / leave / absence）とその日時、申込人数を保持する。
// members/me エンドポイントは、この履歴から自分の申込内容を引く。
export type MockParticipationLog = {
  action: "join" | "leave" | "absence";
  // 参加申込人数（代表者を含む）。leave / absence の場合は undefined として扱う。
  partySize?: number;
  // カテゴリ別の参加人数内訳。join 時に記録し、leave / absence では undefined として扱う。
  participants?: Array<{ category: string; headCount: number }>;
  // 申込時に入力された名前とメールアドレス。join 時のみ記録する。
  username?: string;
  mailAddress?: string;
  // 欠席理由と補足。absence 時のみ記録する。
  reason?: AbsenceReason;
  detail?: string;
  // 申込日時(RFC3339)。join 時のみ記録し、取り消し後は持ち越さない。
  createdAt?: string;
  updatedAt: string;
};

// 参加者一覧取得 API（GET /api/v1/events/{id}/members）が返す参加者1件分の型。
// 匿名参加時は profile が null となる。swagger（GET .../members）の
// レスポンス定義に合わせ、id / eventId は含めない（兄弟エンドポイントと統一）。
export type MockEventMember = {
  username: string;
  mailAddress: string;
  partySize: number;
  profile: EventMemberProfile | null;
  createdAt: string;
};

// 未確定（pending）のゲスト申込1件分の型。
// 確認トークンで確定するまで eventMembers には載せない（ADR-0049）。
// 参加者一覧・参加人数・定員判定から除外される状態を再現するために使う。
export type MockPendingEventMember = {
  // 確認メールのリンクに含まれる確認トークン（モックでは平文で保持）。
  token: string;
  // トークンの有効期限(RFC3339)。
  expiresAt: string;
  username: string;
  mailAddress: string;
  partySize: number;
  participants: ParticipantEntry[];
  createdAt: string;
};

// 確認トークンの有効期間。ADR-0049 の契約値（24時間）。
// モックのトークン発行とテストの期限計算で共有する。
export const CONFIRM_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// 確認トークンが無効・期限切れ・使用済みの場合の共通レスポンス。
// 確定（join-confirm）とプレビュー（join-preview）で同じ契約を返す。
export const invalidTokenResponse = () =>
  HttpResponse.json(
    {
      error: {
        code: "invalid_request",
        message: "確認リンクが無効か、有効期限が切れています",
      },
    },
    { status: 400 },
  );

// イベントが存在しない場合の共通レスポンス（404 not_found）。
export const eventNotFoundResponse = () =>
  HttpResponse.json(
    {
      error: {
        code: "not_found",
        message: "イベントが見つかりません",
      },
    },
    { status: 404 },
  );

// メモリ内参加者管理：eventId ごとにログイン参加者のキー（raw token）を保持
// 重複参加チェック（409 Conflict）のために使用
export const eventParticipants = new Map<string, Set<string>>();

// メモリ内未確定申込管理：eventId ごとに正規化したメールアドレス → 未確定申込 を保持する。
// 一意制約（イベント×メール）を再現するため、同じメールの再申込では上書きしない。
export const pendingEventMembers = new Map<
  string,
  Map<string, MockPendingEventMember>
>();

// メモリ内参加履歴管理：eventId ごとに participantKey → 最新ログ を保持する。
// GET /participation-logs はこの履歴を元に action / participating / updatedAt を返す。
export const participationLogs = new Map<
  string,
  Map<string, MockParticipationLog>
>();

// メモリ内参加者一覧管理：eventId ごとに参加者レコード配列を保持する。
// members エンドポイントはこの配列を元に参加者一覧 / 参加組数 / 合計参加人数を算出する。
export const eventMembers = new Map<string, MockEventMember[]>();

// キャンセル済みイベントIDの記録: POST /api/v1/events/{id}/cancel の非冪等性を表現するため、
// 既にキャンセル済みのイベントに対する再呼び出しは 409 を返す。
export const cancelledEventIds = new Set<string>();

// メールアドレスの照合キー。大文字小文字の違いを同一として扱う。
const toMailKey = (mailAddress: string): string =>
  mailAddress.trim().toLowerCase();

// 確定済みの参加者からメールアドレス一致の1件を探す。
// ログイン参加時の重複判定（同一メールの申込が既にある）に使う。
export const findConfirmedMemberByMail = (
  eventId: string,
  mailAddress: string,
): MockEventMember | null =>
  (eventMembers.get(eventId) ?? []).find(
    (member) => toMailKey(member.mailAddress) === toMailKey(mailAddress),
  ) ?? null;

// 未確定の申込をメールアドレスで探す。
// 有効期限を過ぎた申込は無効として扱い、再申込や重複判定の対象にしない
// （レコード自体は確定時の遅延削除に任せる）。
export const findPendingMemberByMail = (
  eventId: string,
  mailAddress: string,
): MockPendingEventMember | null => {
  const pending =
    pendingEventMembers.get(eventId)?.get(toMailKey(mailAddress)) ?? null;
  if (!pending) return null;

  return new Date(pending.expiresAt).getTime() > Date.now() ? pending : null;
};

// 未確定の申込を確認トークンで探す。確認画面のモックが使う。
export const findPendingMemberByToken = (
  eventId: string,
  token: string,
): { mailKey: string; pending: MockPendingEventMember } | null => {
  const pendings = pendingEventMembers.get(eventId);
  if (!pendings) return null;

  for (const [mailKey, pending] of pendings) {
    if (pending.token === token) {
      return { mailKey, pending };
    }
  }

  return null;
};

// 未確定の申込を削除する（確定・期限切れ時の遅延削除で使う）。
export const removePendingMember = (eventId: string, mailKey: string): void => {
  pendingEventMembers.get(eventId)?.delete(mailKey);
};

// 未確定の申込を登録する。
// テストや動作確認で任意のトークン・期限を仕込めるよう export する。
export const seedPendingJoin = (
  eventId: string,
  pending: Omit<MockPendingEventMember, "createdAt"> & { createdAt?: string },
): MockPendingEventMember => {
  const record: MockPendingEventMember = {
    createdAt: new Date().toISOString(),
    ...pending,
  };
  const pendings =
    pendingEventMembers.get(eventId) ??
    new Map<string, MockPendingEventMember>();
  pendings.set(toMailKey(record.mailAddress), record);
  pendingEventMembers.set(eventId, pendings);

  return record;
};

// 指定の参加者キーがそのイベントに参加中かどうかを判定する。
// 「参加中」の情報源は参加履歴（直近のアクションが join か）に一本化し、
// leave / absence / members-me が同じ基準で 404 を返せるようにする。
// 参加者キーは join エンドポイントの登録に合わせ、サインイン参加なら raw token を渡す。
export const isJoined = (eventId: string, participantKey: string): boolean =>
  participationLogs.get(eventId)?.get(participantKey)?.action === "join";

// 新規作成イベントに参加者モックデータをシードする。
// 主催者画面の動作確認用で、サインイン参加・匿名参加（profile: null）を混在させることで
// 参加組数 / 合計参加人数 / 匿名表示の検証を網羅できるようにしている。
// username（申込時の名前）と profile.displayName（アカウントの表示名）は
// 別物であることを確認できるよう、あえて異なる値を入れている。
export const seedMembersForNewEvent = (eventId: string): void => {
  const base = Date.now() - 1000 * 60 * 60 * 24 * 3;
  const members: MockEventMember[] = [
    {
      username: "Ren Sato",
      mailAddress: "ren@example.com",
      partySize: 2,
      profile: {
        id: "profile-2",
        displayName: "れんさん",
        avatarUrl: "https://i.pravatar.cc/64?u=profile-2",
      },
      createdAt: new Date(base).toISOString(),
    },
    {
      username: "Mina Suzuki",
      mailAddress: "mina@example.com",
      partySize: 1,
      profile: {
        id: "profile-3",
        displayName: "みなさん",
        // アバター未設定（空文字）の表示を確認するためのケース
        avatarUrl: "",
      },
      createdAt: new Date(base + 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      username: "ゲストさん",
      mailAddress: "guest@example.com",
      partySize: 3,
      profile: null,
      createdAt: new Date(base + 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
  eventMembers.set(eventId, members);
};

// 既存イベントに初期参加者をシードする（参加者向けUIの状態確認用）。
// 主に定員・残り人数の状態（通常/残りわずか/満員）を簡単に確認するために使用する。
export const seedEventMembers = (
  eventId: string,
  totalPartySize: number,
): void => {
  const members: MockEventMember[] = [
    {
      username: "初期参加者",
      mailAddress: `seed-${eventId}@example.com`,
      partySize: totalPartySize,
      profile: null,
      createdAt: new Date().toISOString(),
    },
  ];
  eventMembers.set(eventId, members);
};

// サインイン中のモックユーザー自身の申し込みをシードする。
// 参加履歴のキーは join エンドポイントと同じ raw token とし、
// participation-logs / members/me / members のいずれから見ても
// 「本人が申し込み済み」と読める状態を作る。
// 申込期限を過ぎたイベントの申し込み内容モーダルのように、
// その場では作れない状態を申し込み操作なしで確認するために使う。
export const seedMyParticipation = (
  eventId: string,
  {
    appliedAt,
    participants,
  }: {
    // 申込日時(RFC3339)。申し込み内容モーダルの「申し込み日時」に出る。
    appliedAt: string;
    // カテゴリ別の申込内訳。イベント詳細の costs[] と突合されるため、
    // 金額を表示したい場合は costs[] と同じカテゴリ名を指定する。
    participants: Array<{ category: string; headCount: number }>;
  },
): void => {
  const token = MOCK_AUTH_SESSION.token;
  const profile = TOKEN_TO_PROFILE[token];
  if (!profile) return;

  const partySize = participants.reduce(
    (total, participant) => total + participant.headCount,
    0,
  );
  const username = profile.displayName;
  const mailAddress = MOCK_AUTH_SESSION.email ?? "";

  // 重複参加チェック（409 Conflict）と参加中判定の元になる参加者キー。
  const participantKeys = eventParticipants.get(eventId) ?? new Set<string>();
  participantKeys.add(token);
  eventParticipants.set(eventId, participantKeys);

  const logs =
    participationLogs.get(eventId) ?? new Map<string, MockParticipationLog>();
  logs.set(token, {
    action: "join",
    partySize,
    participants,
    username,
    mailAddress,
    createdAt: appliedAt,
    updatedAt: appliedAt,
  });
  participationLogs.set(eventId, logs);

  // 主催者向けの参加者一覧にも同じ申し込みを載せ、参加組数・合計人数を合わせる。
  const members = eventMembers.get(eventId) ?? [];
  eventMembers.set(eventId, [
    ...members,
    { username, mailAddress, partySize, profile, createdAt: appliedAt },
  ]);
};
