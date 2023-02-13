import { errorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import { consoleLog, serializeConsoleLog, toSafeObject } from './interceptLogs';

let resolvedStackTrace: IR<unknown> = { stackTrace: 'loading' };
f.all({
  tablePermissions: import('../Permissions').then(({ getTablePermissions }) =>
    getTablePermissions()
  ),
  systemInformation: import('../InitialContext/systemInfo').then(
    ({ getSystemInfo }) => getSystemInfo()
  ),
  operationPermissions: import('../Permissions').then(
    ({ getOperationPermissions }) => getOperationPermissions()
  ),
  errorContext: Array.from(errorContext),
  schema: import('../DataModel/schema').then(({ schema }) => schema),
  remotePrefs: import('../InitialContext/remotePrefs').then(
    ({ remotePrefs }) => remotePrefs
  ),
  userPreferences: import('../UserPreferences/helpers').then(
    ({ getRawUserPreferences }) => getRawUserPreferences()
  ),
  userInformation: import('../InitialContext/userInformation').then(
    ({ userInformation }) => userInformation
  ),
})
  .then((data) => {
    resolvedStackTrace = data;
    return data;
  })
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
      consoleLog: serializeConsoleLog(consoleLog),
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
