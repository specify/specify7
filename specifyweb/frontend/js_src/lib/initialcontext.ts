import type { MimeType } from './ajax';

let unlock: () => void;

// Context is unlocked for main entrypoint only
export const contextUnlockedPromise = new Promise<void>((resolve) => {
  unlock = resolve;
});

export const unlockInitialContext = (): void => unlock();

export async function load<T>(path: string, mimeType: MimeType): Promise<T> {
  await contextUnlockedPromise;

  // eslint-disable-next-line no-console
  console.log('initial context:', path);
  /*
   * Using async import to avoid circular dependency
   * TODO: find a better solution
   */
  return import('./ajax')
    .then(async ({ ajax }) =>
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ajax<T>(path, { headers: { Accept: mimeType } })
    )
    .then(({ data }) => data);
}

export const initialContext = Promise.all([
  // TODO: cache preferences and permissions
  // Fetch user preferences (NOT CACHED)
  import('./preferencesutils'),
  // Fetch general context information (NOT CACHED)
  import('./schemabase'),
  // Fetch schema (cached)
  import('./schema'),
  // Fetch remote preferences (cached)
  import('./remoteprefs'),
  // Fetch icon definitions (cached)
  import('./icons'),
  // Fetch general system information (cached)
  import('./systeminfo'),
  // Fetch schema localization (cached)
  import('./stringlocalization'),
  // Fetch UI formatters (cached)
  import('./uiformatters'),
  // Fetch user information (NOT CACHED)
  import('./userinfo'),
  // Fetch user permissions (NOT CACHED)
  import('./permissions'),
]).then(async (modules) =>
  Promise.all(modules.map(async ({ fetchContext }) => fetchContext))
);
