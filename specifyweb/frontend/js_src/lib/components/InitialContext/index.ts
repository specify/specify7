/**
 * Load critical resources before app is started
 */

import type { MimeType } from '../../utils/ajax';
import { defined } from '../../utils/types';

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

/**
 * Initial context is locked by default so that front-end does not try to fetch
 * current user and other context while the user is not authenticated
 */
export const unlockInitialContext = (entrypoint: typeof entrypointName): void =>
  unlock(entrypoint);

export const load = async <T>(path: string, mimeType: MimeType): Promise<T> =>
  contextUnlockedPromise.then(async (entrypoint) => {
    if (entrypoint !== 'main') return foreverFetch<T>();

    // Doing async import to avoid a circular dependency
    const { ajax } = await import('../../utils/ajax');

    const { data } = await ajax<T>(cachableUrl(path), {
      errorMode: 'visible',
      headers: { Accept: mimeType },
    });

    return data;
  });

/**
 * These endpoints should still be called as a part of loading the initial
 * context, but are not strictly required for normal operation of the
 * application.
 * Because of this, these endpoints are called after the initialContext and do
 * not block or prevent access to Specify
 */
export const secondaryContext = Promise.all([
  /**
   * REFACTOR: Move non-essential endpoints here from initialContext to speed
   * up initial loading times.
   * Icon Definitions, Legacy UI Localization, Uniqueness Rules, and possibly
   * even Field Formatters and Remote Prefs can all theoretically be moved here.
   *
   * Some more work would need to be done to handle the case where a component
   * attempts to access the resources as they're being fetched.
   */
  // Send basic stats
  import('./stats'),
]).then(async (modules) =>
  Promise.all(modules.map(async ({ fetchContext }) => fetchContext))
);

/**
 * These endpoints are essential for nearly all operations in Specify and have
 * to be fetched before the application can even be accessed.
 * That is, the application will necessarily be blocked until
 * all of these requests are resolved.
 */
export const initialContext = Promise.all([
  // Fetch general context information (NOT CACHED)
  import('../DataModel/schema'),
  // Fetch data model (cached)
  import('../DataModel/tables'),
  // Fetch remote preferences (cached)
  import('./remotePrefs'),
  // Fetch icon definitions (cached)
  import('./icons'),
  // Fetch general system information (cached)
  import('./systemInfo'),
  // Fetch UI formatters (cached)
  import('../FieldFormatters'),
  // Fetch Specify 6 UI localization strings (cached)
  import('./legacyUiLocalization'),
  // Fetch user information (NOT CACHED)
  import('./userInformation'),
  // Fetch user permissions (NOT CACHED)
  import('../Permissions'),
  // Fetch the discipline's uniquenessRules (NOT CACHED)
  import('../DataModel/uniquenessRules'),
  // import('./stats'),
]).then(async (modules) =>
  Promise.all(modules.map(async ({ fetchContext }) => fetchContext))
);
