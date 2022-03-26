import type { MimeType } from './ajax';

/*
 * This belong to ./components/toolbar/cachebuster.tsx but was moved here
 * due to circular dependency issues
 */
export const cachableUrls: Set<string> = new Set();

/**
 * Mark URL as cachable -> should have its cache cleared when cache buster is
 * invoked
 */
export function cachableUrl(url: string): string {
  cachableUrls.add(url);
  return url;
}

let unlock: () => void;

// Context is unlocked for main entrypoint only
export const contextUnlockedPromise = new Promise<void>((resolve) => {
  unlock = resolve;
});

export const unlockInitialContext = (): void => unlock();

export const load = async <T>(path: string, mimeType: MimeType): Promise<T> =>
  contextUnlockedPromise
    .then(
      () =>
        /*
         * Using async import to avoid circular dependency
         * TODO: find a better solution
         */
        import('./ajax')
    )
    .then(async ({ ajax }) =>
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ajax<T>(cachableUrl(path), { headers: { Accept: mimeType } })
    )
    .then(({ data }) => {
      // eslint-disable-next-line no-console
      console.log('initial context:', path);
      return data;
    });

export const initialContext = Promise.all([
  /*
   * TODO: cache preferences and permissions
   * Fetch user preferences (NOT CACHED)
   */
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
