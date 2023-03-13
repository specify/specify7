import { errorContext } from '../../hooks/useErrorContext';
import type { R } from '../../utils/types';
import { consoleLog, toSafeObject } from './interceptLogs';

const resolvedStackTrace: R<unknown> = {};
Promise.all(
  Object.entries({
    systemInformation: import('../InitialContext/systemInfo').then(
      async ({ fetchContext, getSystemInfo }) =>
        fetchContext.then(getSystemInfo)
    ),
    tablePermissions: import('../Permissions').then(
      async ({ getTablePermissions, fetchContext }) =>
        fetchContext.then(getTablePermissions)
    ),
    operationPermissions: import('../Permissions').then(
      async ({ getOperationPermissions, fetchContext }) =>
        fetchContext.then(getOperationPermissions)
    ),
    schema: import('../DataModel/schema').then(
      async ({ fetchContext }) => fetchContext
    ),
    remotePrefs: import('../InitialContext/remotePrefs').then(
      async ({ fetchContext }) => fetchContext
    ),
    userPreferences: import('../UserPreferences/helpers').then(
      async ({ preferencesPromise, getRawUserPreferences }) =>
        preferencesPromise.then(() => getRawUserPreferences())
    ),
    userInformation: import('../InitialContext/userInformation').then(
      async ({ fetchContext }) => fetchContext
    ),
  }).map(async ([key, promise]) => {
    resolvedStackTrace[key] = await promise;
  })
)
  // Can't use softFail here because of circular dependency
  .catch(console.error);

/**
 * The stack trace is about 83KB in size
 */
export const produceStackTrace = (message: unknown): string =>
  JSON.stringify(
    toSafeObject({
      message,
      ...resolvedStackTrace,
      href: globalThis.location.href,
      consoleLog,
      errorContext: Array.from(errorContext),
      pageHtml: document.documentElement.outerHTML,
      localStorage: { ...localStorage },
      // Network log and page load telemetry
      eventLog: globalThis.performance.getEntries(),
      navigator: {
        userAgent: navigator.userAgent,
        language: navigator.language,
      },
    })
  );
