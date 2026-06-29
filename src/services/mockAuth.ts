import type { AuthSession } from "@/types/common";

const STORAGE_KEY = "natu-eve.mock-auth-session";
const CHANGE_EVENT = "natu-eve-mock-auth-change";

export const MOCK_AUTH_SESSION: AuthSession = {
  userId: "mock-user-1",
  token: "mock-access-token",
  name: "Aoi Tanaka",
  iconUrl: "https://example.com/avatar.jpg",
};

// モック認証が有効かどうかを判定する関数
export const isMockAuthEnabled = () =>
  process.env.NEXT_PUBLIC_USE_MSW === "true";

const canUseStorage = () => typeof window !== "undefined";

// AuthSession のプロパティを正規化する関数
const normalizeSession = (
  session: Partial<AuthSession>,
): AuthSession | null => {
  if (typeof session.userId !== "string" || typeof session.token !== "string") {
    return null;
  }

  return {
    userId: session.userId,
    token: session.token,
    name: typeof session.name === "string" ? session.name : undefined,
    iconUrl: typeof session.iconUrl === "string" ? session.iconUrl : undefined,
  };
};

// localStorage から AuthSession を読み込む関数
const readStoredSession = (): AuthSession | null => {
  if (!canUseStorage()) {
    return null;
  }

  // localStorage からセッションを読み込み、正規化して返す
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return normalizeSession(JSON.parse(rawValue) as Partial<AuthSession>);
  } catch {
    return null;
  }
};

// localStorage に AuthSession を書き込む関数
const writeStoredSession = (session: AuthSession | null) => {
  if (!canUseStorage()) {
    return;
  }

  // localStorage にセッションを書き込み、変更イベントを発火する
  try {
    // セッションが存在する場合は localStorage に保存し、存在しない場合は削除する
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage が使えない環境や容量超過では、モック認証を静かに無効化する
  } finally {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
};

// モック認証のセッションを取得する関数
export function getMockAuthSession(): AuthSession | null {
  return readStoredSession();
}

// モック認証のセッションを設定する関数
export function setMockAuthSession(session: AuthSession) {
  writeStoredSession(session);
}

// モック認証のセッションをクリアする関数
export function clearMockAuthSession() {
  writeStoredSession(null);
}

// モック認証のセッション変更を購読する関数
export function subscribeMockAuthSession(listener: () => void) {
  if (!canUseStorage()) {
    return () => undefined;
  }

  const handleChange = () => listener();

  // モック認証のセッション変更イベントと localStorage の変更イベントを監視する
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

let mockWorkerPromise: Promise<void> | null = null; // モックワーカーの起動状態を保持する Promise

// モックワーカーを同期する関数
export async function syncMockWorker(enabled: boolean) {
  // サーバーサイドではモックワーカーを起動しない
  if (typeof window === "undefined") {
    return;
  }

  // モック認証が無効な場合は、モックワーカーを停止する
  if (!enabled) {
    if (mockWorkerPromise) {
      await mockWorkerPromise.catch(() => undefined);
      const { worker } = await import("@/mocks/browser");
      worker.stop();
      mockWorkerPromise = null;
    }
    return;
  }

  // モック認証が有効な場合は、モックワーカーを起動する
  if (!mockWorkerPromise) {
    mockWorkerPromise = (async () => {
      // モックワーカーを起動する
      try {
        const { worker } = await import("@/mocks/browser");
        await worker.start({
          onUnhandledRequest: "bypass",
        });
      } catch (error) {
        mockWorkerPromise = null;
        throw error;
      }
    })();
  }

  await mockWorkerPromise;
}
