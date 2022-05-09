/**
 * Load critical resources before app is started
 */

import type { MimeType } from './ajax';
import { defined } from './types';

/**
 * This belongs to ./components/toolbar/cachebuster.tsx but was moved here
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

export let entrypointName:
  | 'main'
  | 'login'
  | 'chooseCollection'
  | 'passwordChange';

export const getEntrypointName = (): typeof entrypointName =>
  defined(entrypointName);

let unlock: (entrypoint: typeof entrypointName) => void;

// Context is unlocked for main entrypoint only
export const contextUnlockedPromise = new Promise<typeof entrypointName>(
  (resolve) => {
    unlock = resolve;
  }
);

export const foreverPromise = new Promise<any>(() => {
  /* Never resolve it */
});

export const unlockInitialContext = (entrypoint: typeof entrypointName): void =>
  unlock(entrypoint);

export const load = async <T>(path: string, mimeType: MimeType): Promise<T> =>
  contextUnlockedPromise.then(async (entrypoint) =>
    entrypoint === 'main'
      ? /*
         * Using async import to avoid circular dependency
         * TODO: find a better solution
         */
        import('./ajax')
          .then(async ({ ajax }) =>
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ajax<T>(cachableUrl(path), { headers: { Accept: mimeType } })
          )
          .then(({ data }) => {
            // eslint-disable-next-line no-console
            console.log('initial context:', path);
            return data;
          })
      : (foreverPromise as Promise<T>)
  );

export const initialContext = Promise.all([
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
  // Fetch UI formatters (cached)
  import('./uiformatters'),
  // Fetch Specify 6 UI localization strings (NOT CACHED)
  import('./stringlocalization'),
  // Fetch user information (NOT CACHED)
  import('./userinfo'),
  // Fetch user permissions (NOT CACHED)
  import('./permissions'),
]).then(async (modules) =>
  Promise.all(modules.map(async ({ fetchContext }) => fetchContext))
);
