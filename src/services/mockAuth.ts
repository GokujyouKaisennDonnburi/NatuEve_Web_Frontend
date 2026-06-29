import type { AuthSession } from "@/types/common";

const STORAGE_KEY = "natu-eve.mock-auth-session";
const CHANGE_EVENT = "natu-eve-mock-auth-change";

export const MOCK_AUTH_SESSION: AuthSession = {
  userId: "mock-user-1",
  token: "mock-access-token",
  name: "Aoi Tanaka",
  iconUrl: "https://example.com/avatar.jpg",
};

export const isMockAuthEnabled = () =>
  process.env.NEXT_PUBLIC_USE_MSW === "true";

const canUseStorage = () => typeof window !== "undefined";

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

const readStoredSession = (): AuthSession | null => {
  if (!canUseStorage()) {
    return null;
  }

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

const writeStoredSession = (session: AuthSession | null) => {
  if (!canUseStorage()) {
    return;
  }

  // localStorage に保存する際に、セッションが null の場合は削除する
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage が使えない環境や容量超過では、モック認証を静かに無効化する
  }
};

export function getMockAuthSession(): AuthSession | null {
  return readStoredSession();
}

export function setMockAuthSession(session: AuthSession) {
  writeStoredSession(session);
}

export function clearMockAuthSession() {
  writeStoredSession(null);
}

export function subscribeMockAuthSession(listener: () => void) {
  if (!canUseStorage()) {
    return () => undefined;
  }

  const handleChange = () => listener();

  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

let mockWorkerPromise: Promise<void> | null = null;

export async function syncMockWorker(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (!enabled) {
    if (mockWorkerPromise) {
      const { worker } = await import("@/mocks/browser");
      worker.stop();
      mockWorkerPromise = null;
    }
    return;
  }

  // モックワーカーがまだ起動していない場合は、起動する
  if (!mockWorkerPromise) {
    mockWorkerPromise = (async () => {
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
      });
    })();
  }

  await mockWorkerPromise;
}
