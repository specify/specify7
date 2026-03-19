export type AuthResumeSnapshot<PAYLOAD = unknown> = {
  readonly createdAt: number;
  readonly kind: string;
  readonly payload: PAYLOAD;
  readonly url: string;
  readonly version: 1;
};

const storageKey = 'specify7-auth-resume';
const maxAge = 12 * 60 * 60 * 1000;

let currentProvider: (() => AuthResumeSnapshot | undefined) | undefined =
  undefined;

function getSessionStorage(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

function writeSnapshot(snapshot: AuthResumeSnapshot | undefined): void {
  const sessionStorage = getSessionStorage();
  if (sessionStorage === undefined) return;
  if (snapshot === undefined) {
    sessionStorage.removeItem(storageKey);
    return;
  }
  sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
}

function parseSnapshot(
  rawValue: string | null
): AuthResumeSnapshot | undefined {
  if (rawValue === null) return undefined;
  try {
    const parsed = JSON.parse(rawValue) as Partial<AuthResumeSnapshot>;
    return parsed.version === 1 &&
      typeof parsed.createdAt === 'number' &&
      typeof parsed.kind === 'string' &&
      typeof parsed.url === 'string' &&
      'payload' in parsed
      ? (parsed as AuthResumeSnapshot)
      : undefined;
  } catch {
    return undefined;
  }
}

export function currentAuthResumeUrl(): string {
  return globalThis.location.href;
}

export function buildLoginUrl(nextUrl = currentAuthResumeUrl()): string {
  return `/accounts/login/?${new URLSearchParams({ next: nextUrl }).toString()}`;
}

export function setAuthResumeProvider(
  provider: (() => AuthResumeSnapshot | undefined) | undefined
): () => void {
  currentProvider = provider;
  return () => {
    if (currentProvider === provider) currentProvider = undefined;
  };
}

export function saveCurrentAuthResume(): void {
  writeSnapshot(currentProvider?.());
}

export function consumeAuthResumePayload<PAYLOAD>(
  kind: string,
  url = currentAuthResumeUrl()
): PAYLOAD | undefined {
  const sessionStorage = getSessionStorage();
  if (sessionStorage === undefined) return undefined;

  const snapshot = parseSnapshot(sessionStorage.getItem(storageKey));
  if (snapshot === undefined) {
    writeSnapshot(undefined);
    return undefined;
  }

  if (Date.now() - snapshot.createdAt > maxAge) {
    writeSnapshot(undefined);
    return undefined;
  }

  if (snapshot.kind !== kind || snapshot.url !== url) return undefined;

  writeSnapshot(undefined);
  return snapshot.payload as PAYLOAD;
}

export function redirectToLoginWithResume(
  nextUrl = currentAuthResumeUrl()
): void {
  saveCurrentAuthResume();
  globalThis.location.assign(buildLoginUrl(nextUrl));
}
