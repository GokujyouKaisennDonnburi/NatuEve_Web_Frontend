// このファイルは、参加・キャンセル・参加者一覧周りのハンドラー間で
// 共有するメモリ内状態と、その生成・操作ロジックを定義する。
// MSW はプロセス内状態のためリロードでリセットされる前提。

// participation-logs エンドポイントが返す参加履歴1件分の型。
// 直近のアクション（join / leave）とその日時を保持する。
export type MockParticipationLog = {
  action: "join" | "leave";
  updatedAt: string;
};

// 参加者一覧取得 API（GET /api/v1/events/{id}/members）が返す参加者1件分の型。
// 匿名参加時は profileId が null となる。swagger（GET .../members）の
// レスポンス定義に合わせ、id / eventId は含めない（兄弟エンドポイントと統一）。
export type MockEventMember = {
  username: string;
  mailAddress: string;
  partySize: number;
  profileId: string | null;
  createdAt: string;
};

// メモリ内参加者管理：eventId ごとに参加者キー（ログイン時は token、匿名時は anon:mailAddress）を保持
// 重複参加チェック（409 Conflict）のために使用
export const eventParticipants = new Map<string, Set<string>>();

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

// 新規作成イベントに参加者モックデータをシードする。
// 主催者画面の動作確認用で、ログイン参加・匿名参加（profileId: null）を混在させることで
// 参加組数 / 合計参加人数 / 匿名表示の検証を網羅できるようにしている。
export const seedMembersForNewEvent = (eventId: string): void => {
  const base = Date.now() - 1000 * 60 * 60 * 24 * 3;
  const members: MockEventMember[] = [
    {
      username: "Ren Sato",
      mailAddress: "ren@example.com",
      partySize: 2,
      profileId: "profile-2",
      createdAt: new Date(base).toISOString(),
    },
    {
      username: "Mina Suzuki",
      mailAddress: "mina@example.com",
      partySize: 1,
      profileId: "profile-3",
      createdAt: new Date(base + 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      username: "ゲストさん",
      mailAddress: "guest@example.com",
      partySize: 3,
      profileId: null,
      createdAt: new Date(base + 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
  eventMembers.set(eventId, members);
};
