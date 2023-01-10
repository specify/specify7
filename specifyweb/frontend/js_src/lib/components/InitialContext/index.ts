/**
 * Load critical resources before app is started
 */

import type { MimeType } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { defined } from '../../utils/types';
import { formatNumber, MILLISECONDS } from '../Atoms/Internationalization';

/**
 * This belongs to ./components/toolbar/cachebuster.tsx but was moved here
 * due to circular dependency issues
 */
export const cachableUrls = new Set<string>();

/**
 * Mark URL as cachable -> should have its cache cleared when cache buster is
 * invoked
 */
export function cachableUrl(url: string): string {
  cachableUrls.add(url);
  return url;
}

let entrypointName: 'chooseCollection' | 'login' | 'main' | 'passwordChange';

export const getEntrypointName = (): typeof entrypointName =>
  defined(entrypointName, 'Trying to get entrypoint name before it is set');

let unlock: (entrypoint: typeof entrypointName) => void;

// Context is unlocked for main entrypoint only
export const contextUnlockedPromise = new Promise<typeof entrypointName>(
  (resolve) => {
    unlock = resolve;
  }
);

const foreverPromise = new Promise<any>(() => {
  /* Never resolve it */
});
/**
 * This is used to gracefully prevent fetching of some resources when running
 * front-end tests
 */
export const foreverFetch = async <T>(): Promise<T> => foreverPromise;

export const unlockInitialContext = (entrypoint: typeof entrypointName): void =>
  unlock(entrypoint);

export const load = async <T>(path: string, mimeType: MimeType): Promise<T> =>
  contextUnlockedPromise.then(async (entrypoint) => {
    if (entrypoint !== 'main') return foreverFetch<T>();
    const startTime = Date.now();

    // Doing async import to avoid a circular dependency
    const { ajax } = await import('../../utils/ajax');

    const { data } = await ajax<T>(cachableUrl(path), {
      headers: { Accept: mimeType },
    });
    const endTime = Date.now();
    const timePassed = endTime - startTime;
    // A very crude detection mechanism
    const isCached = timePassed < 100;

    console.log(
      `${path} %c[${
        isCached
          ? 'cached'
          : `${formatNumber(f.round(timePassed / MILLISECONDS, 0.01))}s`
      }]`,
      `color: ${isCached ? '#9fa' : '#f99'}`
    );
    return data;
  });

export const initialContext = Promise.all([
  // Fetch general context information (NOT CACHED)
  import('../DataModel/schemaBase'),
  // Fetch schema (cached)
  import('../DataModel/schema'),
  // Fetch remote preferences (cached)
  import('./remotePrefs'),
  // Fetch icon definitions (cached)
  import('./icons'),
  // Fetch general system information (cached)
  import('./systemInfo'),
  // Fetch UI formatters (cached)
  import('../Forms/uiFormatters'),
  // Fetch Specify 6 UI localization strings (CACHED)
  import('./legacyUiLocalization'),
  // Fetch user information (NOT CACHED)
  import('./userInformation'),
  // Fetch user permissions (NOT CACHED)
  import('../Permissions'),
]).then(async (modules) =>
  Promise.all(modules.map(async ({ fetchContext }) => fetchContext))
);
