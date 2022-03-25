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
  // Fetch user preferences
  import('./preferencesutils'),
  // Fetch general context information
  import('./schemabase'),
  // Fetch schema
  import('./schema'),
  // Fetch remote preferences
  import('./remoteprefs'),
  // Fetch icon definitions
  import('./icons'),
  // Fetch schema localization
  import('./stringlocalization'),
  // Fetch UI formatters
  import('./uiformatters'),
  // Fetch user information
  import('./userinfo'),
  // Fetch user permissions
  import('./permissions'),
]).then(async (modules) =>
  Promise.all(modules.map(async ({ fetchContext }) => fetchContext))
);
