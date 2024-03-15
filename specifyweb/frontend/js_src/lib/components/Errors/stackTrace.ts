import { errorContext } from '../../hooks/useErrorContext';
import type { R } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { consoleLog } from './interceptLogs';

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
    userPreferences: import('../Preferences/userPreferences').then(
      async ({ userPreferences }) =>
        userPreferences.fetch().then(() => userPreferences.getRaw())
    ),
    collectionPreferences: import('../Preferences/collectionPreferences').then(
      async ({ collectionPreferences }) =>
        collectionPreferences.fetch().then(() => collectionPreferences.getRaw())
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
    Object.fromEntries(
      Object.entries({
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
      }).sort(
        sortFunction(([key]) => {
          const order = errorSorted.indexOf(key);
          return order === -1 ? Number.POSITIVE_INFINITY : order;
        })
      )
    )
  );

const errorSorted = [
  'message',
  'userInformation',
  'systemInformation',
  'pageHtml',
  'href',
  'errorContext',
  'navigator',
  'consoleLog',
];
